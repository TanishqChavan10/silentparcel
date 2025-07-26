// API route for downloading files or selected files from a ZIP archive using a token. Handles password protection, download limits, and audit logging.
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { storage, BUCKETS } from "@/lib/appwrite";
import { verifyPassword, getClientIP } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";
import AdmZip from "adm-zip";
import stream from "stream";

// Checks if the environment is properly configured for storage access
function isProperlyConfigured() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !==
      "https://placeholder.supabase.co" &&
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT !==
      "https://placeholder.appwrite.io/v1"
  );
}

// Converts Appwrite file download result to Buffer
async function getAppwriteFileBuffer(filePromise: Promise<any>): Promise<Buffer> {
  if (!(filePromise && typeof filePromise.then === 'function')) {
    throw new Error('getAppwriteFileBuffer expected a Promise, but received a non-Promise value.');
  }
  const file = await filePromise;
  if (!Buffer.isBuffer(file) && !(file instanceof stream.Readable) && typeof file.arrayBuffer !== 'function') {
    // Only log type, not full object, for security
    console.error('Unknown file type from Appwrite storage:', {
      type: typeof file,
      constructor: file && file.constructor && file.constructor.name,
      keys: file && Object.keys(file),
      file
    });
  }
  if (file instanceof URL) {
    throw new Error("Appwrite SDK returned a URL object. This is unexpected. Check your Appwrite SDK version and usage.");
  }
  if (Buffer.isBuffer(file)) return file;
  if (file instanceof stream.Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of file) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks as any);
  }
  if (typeof file.arrayBuffer === "function") {
    return Buffer.from(await file.arrayBuffer());
  }
  if (file instanceof ArrayBuffer) {
    return Buffer.from(file);
  }
  if (file && file.buffer && file.buffer instanceof ArrayBuffer) {
    return Buffer.from(file.buffer);
  }
  throw new Error("Unknown file type returned from Appwrite storage");
}

// Validates file access and permissions
async function validateFileAccess(token: string, password?: string | null) {
  console.log('Fetching file metadata from database');
  const { data: fileRecord, error: supabaseError } = await supabaseAdmin
    .from("zip_file_metadata")
    .select("*")
    .eq("download_token", token)
    .single();

  if (supabaseError || !fileRecord) {
    console.log('File not found or expired');
    return { error: NextResponse.json({ error: "File not found or expired" }, { status: 404 }) };
  }

  if (!fileRecord.is_active) {
    console.log('File has been deleted');
    return { error: NextResponse.json({ error: "File has been deleted" }, { status: 410 }) };
  }

  if (fileRecord.expiry_date && new Date(fileRecord.expiry_date) < new Date()) {
    console.log('File has expired');
    return { error: NextResponse.json({ error: "File has expired" }, { status: 410 }) };
  }

  if (fileRecord.max_downloads && fileRecord.download_count >= fileRecord.max_downloads) {
    console.log('Download limit exceeded');
    return { error: NextResponse.json({ error: "Download limit exceeded" }, { status: 410 }) };
  }

  if (fileRecord.password) {
    if (!password) {
      console.log('Password required but not provided');
      return { error: NextResponse.json({ error: "Password required", requiresPassword: true }, { status: 401 }) };
    }
    const isValidPassword = await verifyPassword(password, fileRecord.password);
    if (!isValidPassword) {
      console.log('Invalid password provided');
      return { error: NextResponse.json({ error: "Invalid password" }, { status: 401 }) };
    }
    console.log('Password validated');
  }

  return { fileRecord };
}

// Downloads and decrypts file from Appwrite
async function downloadAndDecryptFile(appwriteId: string, encryptedKey: string) {
  console.log('Downloading file from Appwrite');
  let fileDownloadResult = storage.getFileDownload(BUCKETS.FILES, appwriteId);
  
  if (fileDownloadResult instanceof URL) {
    console.log('Appwrite SDK returned a URL instead of a stream');
    throw new Error("Appwrite SDK is returning a URL instead of a stream. Please use the Node.js SDK/server environment.");
  }
  
  if (!(fileDownloadResult && typeof (fileDownloadResult as any).then === 'function')) {
    console.log('Appwrite SDK did not return a Promise');
    throw new Error("Appwrite SDK did not return a Promise. Please check your SDK version and usage.");
  }

  try {
    const encryptedBuffer = await getAppwriteFileBuffer(fileDownloadResult as Promise<any>);
    const { decryptZipFile } = require('@/lib/security');
    const fileBuffer = decryptZipFile(encryptedBuffer, encryptedKey);
    console.log('File downloaded and decrypted from Appwrite');
    return fileBuffer;
  } catch (err) {
    console.error("Appwrite file fetch or decrypt error", err);
    throw new Error("Failed to fetch or decrypt file from storage. Please try again later or contact support.");
  }
}

// Updates download count and handles file cleanup if needed
async function updateDownloadCountAndCleanup(fileRecord: any, request: NextRequest) {
  let shouldDeactivate = false;
  try {
    const newDownloadCount = (fileRecord.download_count || 0) + 1;
    const now = new Date();
    const expiryDate = new Date(fileRecord.expiry_date);
    
    if (newDownloadCount >= fileRecord.max_downloads || now > expiryDate) {
      shouldDeactivate = true;
    }
    
    const { error: updateError } = await supabaseAdmin
      .from("zip_file_metadata")
      .update({
        download_count: newDownloadCount,
        last_downloaded_at: now.toISOString(),
        is_active: !shouldDeactivate
      })
      .eq("id", fileRecord.id);
      
    if (updateError) {
      console.error('Failed to update download count', updateError);
    } else {
      console.log('Download count incremented');
    }
    
    if (shouldDeactivate) {
      try {
        await storage.deleteFile(BUCKETS.FILES, fileRecord.appwrite_id);
        const { error: deleteError } = await supabaseAdmin
          .from("zip_file_metadata")
          .delete()
          .eq("id", fileRecord.id);
          
        if (deleteError) {
          console.error('Failed to delete zip_file_metadata row:', deleteError);
        } else {
          console.log('File and metadata deleted after expiry or max downloads');
          let userId = 'human';
          if (newDownloadCount >= fileRecord.max_downloads) {
            userId = 'download_limit';
          } else if (now > expiryDate) {
            userId = 'time_limit';
          }
          
          await supabaseAdmin.from("audit_logs").insert({
            action: "file_deleted",
            resource_type: "zip",
            resource_id: fileRecord.id,
            user_id: userId,
            ip_address: getClientIP(request),
            // // user_agent: request.headers.get("user-agent"),
            metadata: {
              filename: fileRecord.original_name,
              reason: (newDownloadCount >= fileRecord.max_downloads) ? 'max_downloads_reached' : 'expired',
              downloadCount: newDownloadCount,
              expiryDate: fileRecord.expiry_date
            },
          });
        }
      } catch (err) {
        console.error('Error deleting file from Appwrite or Supabase', err);
      }
    }
  } catch (err) {
    console.error('Exception while updating download count', err);
  }
}

// Creates audit log entry
async function createAuditLog(action: string, fileRecord: any, request: NextRequest, additionalMetadata: any = {}) {
  try {
    await supabaseAdmin.from("audit_logs").insert({
      action,
      resource_type: "zip",
      resource_id: fileRecord.id,
      ip_address: getClientIP(request),
      // user_agent: request.headers.get("user-agent"),
      metadata: {
        filename: fileRecord.original_name,
        downloadCount: (fileRecord.download_count || 0) + 1,
        ...additionalMetadata
      },
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}

// Handles HEAD requests for password validation (used by frontend) - NO download count increment
export async function HEAD(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  console.log('Download route: Start HEAD handler for password validation');
  if (!isProperlyConfigured()) {
    console.log('Service not properly configured');
    return NextResponse.json(
      { error: "Service not properly configured" },
      { status: 503 }
    );
  }

  try {
    const { token } = params;
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");

    // Validate file access and password
    const validationResult = await validateFileAccess(token, password);
    if (validationResult.error) return validationResult.error;

    // If we reach here, password is valid - return success without incrementing download count
    console.log('Password validation successful - no download count incremented');
    return new NextResponse(null, { status: 200 });

  } catch (error) {
    console.error("Password validation error", error);
    return NextResponse.json(
      { error: "Password validation failed. Please try again later or contact support." },
      { status: 500 }
    );
  }
}

// Handles GET requests for file download
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  console.log('Download route: Start GET handler');
  if (!isProperlyConfigured()) {
    console.log('Service not properly configured');
    return NextResponse.json(
      { error: "Service not properly configured" },
      { status: 503 }
    );
  }

  try {
    const { token } = params;
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");
    const meta = searchParams.get("meta");

    // Validate file access
    const validationResult = await validateFileAccess(token, password);
    if (validationResult.error) return validationResult.error;
    const { fileRecord } = validationResult;

    // Return metadata if requested
    if (meta === "1") {
      console.log('Returning file metadata');
      const metadata = {
        id: fileRecord.id,
        name: fileRecord.original_name,
        size: fileRecord.size,
        type: fileRecord.mime_type,
        uploadDate: fileRecord.uploaded_at,
        downloadCount: fileRecord.download_count,
        maxDownloads: fileRecord.max_downloads,
        expiryDate: fileRecord.expiry_date,
        isPasswordProtected: !!fileRecord.password,
        virusScanStatus: fileRecord.virus_scan_status,
        appwrite_id: fileRecord.appwrite_id,
        isActive: fileRecord.is_active
      };
      return NextResponse.json(metadata);
    }

    // Download and decrypt file
    const fileBuffer = await downloadAndDecryptFile(fileRecord.appwrite_id, fileRecord.encrypted_key);

    // Update download count and handle cleanup
    await updateDownloadCountAndCleanup(fileRecord, request);

    // Create audit log
    await createAuditLog("file_download", fileRecord, request);

    // Return file
    console.log('Returning file as download');
    const response = new NextResponse(fileBuffer);
    response.headers.set("Content-type", "application/zip");
    response.headers.set("Content-Disposition", `attachment; filename="${fileRecord.original_name}"`);
    return response;

  } catch (error) {
    console.error("Download error", error);
    return NextResponse.json(
      { error: "Download failed. Please try again later or contact support." },
      { status: 500 }
    );
  }
}

// Handles POST requests for selective file/folder extraction from ZIP
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  console.log('POST /files/download/[token] - Start');
  if (!isProperlyConfigured()) {
    console.log('Service not properly configured');
    return NextResponse.json(
      { error: "Service not properly configured" },
      { status: 503 }
    );
  }

  try {
    const { token } = params;
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");
    const body = await request.json();
    const selectedPaths: string[] = Array.isArray(body.paths) ? body.paths : [];
    
    if (!selectedPaths.length) {
      console.log('No files/folders selected');
      return NextResponse.json({ error: "No files/folders selected" }, { status: 400 });
    }

    // Validate file access
    const validationResult = await validateFileAccess(token, password);
    if (validationResult.error) return validationResult.error;
    const { fileRecord } = validationResult;

    // Download and decrypt ZIP
    const zipBuffer = await downloadAndDecryptFile(fileRecord.appwrite_id, fileRecord.encrypted_key);

    // Extract only selected files/folders from the ZIP
    let newZipBuffer: Buffer;
    let newZipName: string;
    try {
      console.log('Extracting selected files/folders from ZIP');
      const zip = new AdmZip(zipBuffer);
      const entries = zip.getEntries();
      const selectedEntries = entries.filter(entry =>
        selectedPaths.some(sel =>
          entry.entryName === sel || entry.entryName.startsWith(sel.endsWith("/") ? sel : sel + "/")
        )
      );
      
      if (!selectedEntries.length) {
        console.log('No matching files/folders in archive');
        return NextResponse.json({ error: "No matching files/folders in archive" }, { status: 404 });
      }
      
      // Create a new ZIP with only selected entries
      const newZip = new AdmZip();
      for (const entry of selectedEntries) {
        if (entry.isDirectory) {
          newZip.addFile(entry.entryName, Buffer.alloc(0));
        } else {
          newZip.addFile(entry.entryName, entry.getData());
        }
      }
      
      newZipBuffer = newZip.toBuffer();
      newZipName =
        selectedEntries.length === 1 && !selectedEntries[0].isDirectory
          ? selectedEntries[0].name
          : `${fileRecord.original_name.replace(/\.zip$/, "")}_partial.zip`;
      console.log('Created new ZIP with selected files');
    } catch (err) {
      console.error("ZIP extraction error", err);
      return NextResponse.json({ error: "Failed to extract selected files. Please try again later or contact support." }, { status: 500 });
    }

    // Update download count and handle cleanup
    await updateDownloadCountAndCleanup(fileRecord, request);

    // Create audit log
    await createAuditLog("file_download_partial", fileRecord, request, { selected: selectedPaths });

    // Return new ZIP
    console.log('Returning new ZIP as download');
    const response = new NextResponse(newZipBuffer);
    response.headers.set("Content-Type", "application/zip");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename=\"${newZipName}\"`
    );
    return response;

  } catch (error) {
    console.error("Selective download error", error);
    return NextResponse.json(
      { error: "Selective download failed. Please try again later or contact support." },
      { status: 500 }
    );
  }
}
