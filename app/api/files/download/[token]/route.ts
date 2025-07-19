export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { storage, BUCKETS } from "@/lib/appwrite";
import { verifyPassword, getClientIP } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";
import AdmZip from "adm-zip";
import stream from "stream";

// Check if we're in a proper environment
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

// Utility: Normalize Appwrite file download to Buffer
// NOTE: If you get linter errors about Buffer/stream, ensure your tsconfig.json includes "node" in types and "esnext" or "es2020" in lib.
async function getAppwriteFileBuffer(filePromise: Promise<any>): Promise<Buffer> {
  if (!(filePromise && typeof filePromise.then === 'function')) {
    throw new Error('getAppwriteFileBuffer expected a Promise, but received a non-Promise value. This usually means storage.getFileDownload is returning a URL. Check your Appwrite SDK version and usage.');
  }
  const file = await filePromise;
  // Debug log for unknown file type
  if (!Buffer.isBuffer(file) && !(file instanceof stream.Readable) && typeof file.arrayBuffer !== 'function') {
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
  // Fallback: handle ArrayBuffer or BufferSource
  if (file instanceof ArrayBuffer) {
    return Buffer.from(file);
  }
  if (file && file.buffer && file.buffer instanceof ArrayBuffer) {
    return Buffer.from(file.buffer);
  }
  throw new Error("Unknown file type returned from Appwrite storage");
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  if (!isProperlyConfigured()) {
    console.log('Checkpoint: Service not properly configured');
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

    // Fetch file metadata from zip_file_metadata
    const { data: fileRecord, error: supabaseError } = await supabaseAdmin
      .from("zip_file_metadata")
      .select("*")
      .eq("download_token", token)
      .single();
    console.log('Checkpoint: Fetched file metadata');

    if (supabaseError || !fileRecord) {
      console.log('Checkpoint: File not found or expired');
      return NextResponse.json(
        { error: "File not found or expired" },
        { status: 404 }
      );
    }
    if (!fileRecord.is_active) {
      console.log('Checkpoint: File has been deleted');
      return NextResponse.json(
        { error: "File has been deleted" },
        { status: 410 }
      );
    }
    if (
      fileRecord.expiry_date &&
      new Date(fileRecord.expiry_date) < new Date()
    ) {
      console.log('Checkpoint: File has expired');
      return NextResponse.json({ error: "File has expired" }, { status: 410 });
    }
    if (
      fileRecord.max_downloads &&
      fileRecord.download_count >= fileRecord.max_downloads
    ) {
      console.log('Checkpoint: Download limit exceeded');
      return NextResponse.json(
        { error: "Download limit exceeded" },
        { status: 410 }
      );
    }
    if (meta === "1") {
      console.log('Checkpoint: Returning file metadata');
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
    if (fileRecord.password) {
      if (!password) {
        console.log('Checkpoint: Password required but not provided');
        return NextResponse.json(
          { error: "Password required", requiresPassword: true },
          { status: 401 }
        );
      }
      const isValidPassword = await verifyPassword(
        password,
        fileRecord.password
      );
      if (!isValidPassword) {
        console.log('Checkpoint: Invalid password provided');
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 }
        );
      }
      console.log('Checkpoint: Password validated');
    }
    const appwriteId = fileRecord.appwrite_id;
    if (!appwriteId) {
      console.log('Checkpoint: File storage reference missing');
      return NextResponse.json(
        { error: "File storage reference missing" },
        { status: 500 }
      );
    }
    // Download from Appwrite (ensure buffer)
    let fileBuffer: Buffer;
    let fileDownloadResult = storage.getFileDownload(BUCKETS.FILES, appwriteId);
    // Type guard for Promise vs URL
    if (fileDownloadResult instanceof URL) {
      console.log('Checkpoint: Appwrite SDK returned a URL instead of a stream');
      return NextResponse.json({ error: "Appwrite SDK is returning a URL instead of a stream. Please use the Node.js SDK/server environment." }, { status: 500 });
    }
    if (!(fileDownloadResult && typeof (fileDownloadResult as any).then === 'function')) {
      console.log('Checkpoint: Appwrite SDK did not return a Promise');
      return NextResponse.json({ error: "Appwrite SDK did not return a Promise. Please check your SDK version and usage." }, { status: 500 });
    }
    try {
      fileBuffer = await getAppwriteFileBuffer(fileDownloadResult as Promise<any>);
      console.log('Checkpoint: Downloaded file from Appwrite');
    } catch (err) {
      console.error("Appwrite file fetch error:", err);
      return NextResponse.json({ error: "Failed to fetch file from storage. Please try again later or contact support." }, { status: 500 });
    }
    // Update download count (awaited)
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
        console.error('Failed to update download count:', updateError);
      } else {
        console.log('Checkpoint: Download count incremented');
      }
      // If should deactivate, delete from Appwrite and Supabase
      if (shouldDeactivate) {
        try {
          // Delete from Appwrite storage
          await storage.deleteFile(BUCKETS.FILES, fileRecord.appwrite_id);
          // Delete from Supabase
          const { error: deleteError } = await supabaseAdmin
            .from("zip_file_metadata")
            .delete()
            .eq("id", fileRecord.id);
          if (deleteError) {
            console.error('Failed to delete zip_file_metadata row:', deleteError);
          } else {
            console.log('Checkpoint: File and metadata deleted after expiry or max downloads');
            // Audit log for deletion
            let userId = 'human';
            if (newDownloadCount >= fileRecord.max_downloads) {
              userId = 'download_limit';
            } else if (now > expiryDate) {
              userId = 'time_limit';
            }
            await supabaseAdmin.from("audit_logs").insert({
              action: "file_deleted",
              resource_type: "file",
              resource_id: fileRecord.id,
              user_id: userId,
              ip_address: getClientIP(request),
              user_agent: request.headers.get("user-agent"),
              metadata: {
                filename: fileRecord.original_name,
                reason: (newDownloadCount >= fileRecord.max_downloads) ? 'max_downloads_reached' : 'expired',
                downloadCount: newDownloadCount,
                expiryDate: fileRecord.expiry_date
              },
            });
          }
        } catch (err) {
          console.error('Error deleting file from Appwrite or Supabase:', err);
        }
      }
    } catch (err) {
      console.error('Exception while updating download count:', err);
    }
    // Log audit event (fire and forget)
    supabaseAdmin.from("audit_logs").insert({
      action: "file_download",
      resource_type: "file",
      resource_id: fileRecord.id,
      ip_address: getClientIP(request),
      user_agent: request.headers.get("user-agent"),
      metadata: {
        filename: fileRecord.original_name,
        downloadCount: (fileRecord.download_count || 0) + 1,
      },
    });
    console.log('Checkpoint: Returning file as download');
    // return NextResponse.json(fileBuffer);
    const response = new NextResponse(fileBuffer);
    response.headers.set("Content-type", "application/zip");
    response.headers.set("Content-Disposition", `attachment; filename="${fileRecord.original_name}"`);
    // response.headers.set("content-disposition", 'attachment; filename="${fileRecord.original_name}"')
    // response.headers.set("content-disposition", `attachment; filename="${fileRecord.original_name}"`);
    // response.headers.set("Content-Disposition", 'attachment; filename="${fileRecord.original_name}"');
    return response;
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Download failed. Please try again later or contact support." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  if (!isProperlyConfigured()) {
    console.log('Checkpoint: Service not properly configured');
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
      console.log('Checkpoint: No files/folders selected');
      return NextResponse.json({ error: "No files/folders selected" }, { status: 400 });
    }
    // Fetch file metadata from zip_file_metadata
    const { data: fileRecord, error: supabaseError } = await supabaseAdmin
      .from("zip_file_metadata")
      .select("*")
      .eq("download_token", token)
      .single();
    console.log('Checkpoint: Fetched file metadata');
    if (supabaseError || !fileRecord) {
      console.log('Checkpoint: File not found or expired');
      return NextResponse.json(
        { error: "File not found or expired" },
        { status: 404 }
      );
    }
    if (!fileRecord.is_active) {
      console.log('Checkpoint: File has been deleted');
      return NextResponse.json(
        { error: "File has been deleted" },
        { status: 410 }
      );
    }
    if (
      fileRecord.expiry_date &&
      new Date(fileRecord.expiry_date) < new Date()
    ) {
      console.log('Checkpoint: File has expired');
      return NextResponse.json({ error: "File has expired" }, { status: 410 });
    }
    if (
      fileRecord.max_downloads &&
      fileRecord.download_count >= fileRecord.max_downloads
    ) {
      console.log('Checkpoint: Download limit exceeded');
      return NextResponse.json(
        { error: "Download limit exceeded" },
        { status: 410 }
      );
    }
    if (fileRecord.password) {
      if (!password) {
        console.log('Checkpoint: Password required but not provided');
        return NextResponse.json(
          { error: "Password required", requiresPassword: true },
          { status: 401 }
        );
      }
      const isValidPassword = await verifyPassword(password, fileRecord.password);
      if (!isValidPassword) {
        console.log('Checkpoint: Invalid password provided');
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 }
        );
      }
      console.log('Checkpoint: Password validated');
    }
    const appwriteId = fileRecord.appwrite_id;
    if (!appwriteId) {
      console.log('Checkpoint: File storage reference missing');
      return NextResponse.json(
        { error: "File storage reference missing" },
        { status: 500 }
      );
    }
    // Download the ZIP from Appwrite (ensure buffer)
    let zipBuffer: Buffer;
    let zipDownloadResult = storage.getFileDownload(BUCKETS.FILES, appwriteId);
    // Type guard for Promise vs URL
    if (zipDownloadResult instanceof URL) {
      console.log('Checkpoint: Appwrite SDK returned a URL instead of a stream');
      return NextResponse.json({ error: "Appwrite SDK is returning a URL instead of a stream. Please use the Node.js SDK/server environment." }, { status: 500 });
    }
    if (!(zipDownloadResult && typeof (zipDownloadResult as any).then === 'function')) {
      console.log('Checkpoint: Appwrite SDK did not return a Promise');
      return NextResponse.json({ error: "Appwrite SDK did not return a Promise. Please check your SDK version and usage." }, { status: 500 });
    }
    try {
      zipBuffer = await getAppwriteFileBuffer(zipDownloadResult as Promise<any>);
      console.log('Checkpoint: Downloaded ZIP from Appwrite');
    } catch (err) {
      console.error("Appwrite file fetch error:", err);
      return NextResponse.json({ error: "Failed to fetch file from storage. Please try again later or contact support." }, { status: 500 });
    }
    // Extract only selected files/folders from the ZIP
    let newZipBuffer: Buffer;
    let newZipName: string;
    try {
      const zip = new AdmZip(zipBuffer);
      const entries = zip.getEntries();
      const selectedEntries = entries.filter(entry =>
        selectedPaths.some(sel =>
          entry.entryName === sel || entry.entryName.startsWith(sel.endsWith("/") ? sel : sel + "/")
        )
      );
      if (!selectedEntries.length) {
        console.log('Checkpoint: No matching files/folders in archive');
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
      console.log('Checkpoint: Created new ZIP with selected files');
    } catch (err) {
      console.error("ZIP extraction error:", err);
      return NextResponse.json({ error: "Failed to extract selected files. Please try again later or contact support." }, { status: 500 });
    }
    // Update download count (awaited)
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
        console.error('Failed to update download count:', updateError);
      } else {
        console.log('Checkpoint: Download count incremented');
      }
      // If should deactivate, delete from Appwrite and Supabase
      if (shouldDeactivate) {
        try {
          // Delete from Appwrite storage
          await storage.deleteFile(BUCKETS.FILES, fileRecord.appwrite_id);
          // Delete from Supabase
          const { error: deleteError } = await supabaseAdmin
            .from("zip_file_metadata")
            .delete()
            .eq("id", fileRecord.id);
          if (deleteError) {
            console.error('Failed to delete zip_file_metadata row:', deleteError);
          } else {
            console.log('Checkpoint: File and metadata deleted after expiry or max downloads');
            // Audit log for deletion
            let userId = 'human';
            if (newDownloadCount >= fileRecord.max_downloads) {
              userId = 'download_limit';
            } else if (now > expiryDate) {
              userId = 'time_limit';
            }
            await supabaseAdmin.from("audit_logs").insert({
              action: "file_deleted",
              resource_type: "file",
              resource_id: fileRecord.id,
              user_id: userId,
              ip_address: getClientIP(request),
              user_agent: request.headers.get("user-agent"),
              metadata: {
                filename: fileRecord.original_name,
                reason: (newDownloadCount >= fileRecord.max_downloads) ? 'max_downloads_reached' : 'expired',
                downloadCount: newDownloadCount,
                expiryDate: fileRecord.expiry_date
              },
            });
          }
        } catch (err) {
          console.error('Error deleting file from Appwrite or Supabase:', err);
        }
      }
    } catch (err) {
      console.error('Exception while updating download count:', err);
    }
    // Log audit event (fire and forget)
    supabaseAdmin.from("audit_logs").insert({
      action: "file_download_partial",
      resource_type: "file",
      resource_id: fileRecord.id,
      ip_address: getClientIP(request),
      user_agent: request.headers.get("user-agent"),
      metadata: {
        filename: fileRecord.original_name,
        downloadCount: (fileRecord.download_count || 0) + 1,
        selected: selectedPaths,
      },
    });
    console.log('Checkpoint: Returning new ZIP as download');
    // Return the new ZIP as a download
    const response = new NextResponse(newZipBuffer);
    response.headers.set("Content-Type", "application/zip");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename=\"${newZipName}\"`
    );
    return response;
  } catch (error) {
    console.error("Selective download error:", error);
    return NextResponse.json(
      { error: "Selective download failed. Please try again later or contact support." },
      { status: 500 }
    );
  }
}
