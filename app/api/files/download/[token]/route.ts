import { NextRequest, NextResponse } from "next/server";
import { storage, BUCKETS } from "@/lib/appwrite";
import { verifyPassword, getClientIP } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";
import AdmZip from "adm-zip";

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

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  if (!isProperlyConfigured()) {
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

    // Fetch file metadata from zip_metadata
    const { data: fileRecord, error: supabaseError } = await supabaseAdmin
      .from("zip_metadata")
      .select("*")
      .eq("download_token", token)
      .single();

    if (supabaseError || !fileRecord) {
      return NextResponse.json(
        { error: "File not found or expired" },
        { status: 404 }
      );
    }
    if (!fileRecord.is_active) {
      return NextResponse.json(
        { error: "File has been deleted" },
        { status: 410 }
      );
    }
    if (
      fileRecord.expiry_date &&
      new Date(fileRecord.expiry_date) < new Date()
    ) {
      return NextResponse.json({ error: "File has expired" }, { status: 410 });
    }
    if (
      fileRecord.max_downloads &&
      fileRecord.download_count >= fileRecord.max_downloads
    ) {
      return NextResponse.json(
        { error: "Download limit exceeded" },
        { status: 410 }
      );
    }
    if (meta === "1") {
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
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 }
        );
      }
    }
    const appwriteId = fileRecord.appwrite_id;
    if (!appwriteId) {
      return NextResponse.json(
        { error: "File storage reference missing" },
        { status: 500 }
      );
    }
    // Download from Appwrite
    const fileStream = await storage.getFileDownload(BUCKETS.FILES, appwriteId);
    const response = new NextResponse(fileStream as any);
    response.headers.set("Content-Type", fileRecord.mime_type);
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${fileRecord.original_name}"`
    );
    // Update download count
    await supabaseAdmin
      .from("zip_metadata")
      .update({
        download_count: (fileRecord.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq("id", fileRecord.id);
    // Log audit event
    await supabaseAdmin.from("audit_logs").insert({
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
    return response;
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Download failed. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  if (!isProperlyConfigured()) {
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
      return NextResponse.json({ error: "No files/folders selected" }, { status: 400 });
    }
    // Fetch file metadata from zip_metadata
    const { data: fileRecord, error: supabaseError } = await supabaseAdmin
      .from("zip_metadata")
      .select("*")
      .eq("download_token", token)
      .single();
    if (supabaseError || !fileRecord) {
      return NextResponse.json(
        { error: "File not found or expired" },
        { status: 404 }
      );
    }
    if (!fileRecord.is_active) {
      return NextResponse.json(
        { error: "File has been deleted" },
        { status: 410 }
      );
    }
    if (
      fileRecord.expiry_date &&
      new Date(fileRecord.expiry_date) < new Date()
    ) {
      return NextResponse.json({ error: "File has expired" }, { status: 410 });
    }
    if (
      fileRecord.max_downloads &&
      fileRecord.download_count >= fileRecord.max_downloads
    ) {
      return NextResponse.json(
        { error: "Download limit exceeded" },
        { status: 410 }
      );
    }
    if (fileRecord.password) {
      if (!password) {
        return NextResponse.json(
          { error: "Password required", requiresPassword: true },
          { status: 401 }
        );
      }
      const isValidPassword = await verifyPassword(password, fileRecord.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 }
        );
      }
    }
    const appwriteId = fileRecord.appwrite_id;
    if (!appwriteId) {
      return NextResponse.json(
        { error: "File storage reference missing" },
        { status: 500 }
      );
    }
    // Download the ZIP from Appwrite
    const fileStream = await storage.getFileDownload(BUCKETS.FILES, appwriteId);
    const zipBuffer = Buffer.isBuffer(fileStream)
      ? fileStream
      : Buffer.from(await (fileStream as any).arrayBuffer());
    const zip = new AdmZip(zipBuffer);
    // Filter entries to only those matching selectedPaths (support folders)
    const entries = zip.getEntries();
    const selectedEntries = entries.filter(entry =>
      selectedPaths.some(sel =>
        entry.entryName === sel || entry.entryName.startsWith(sel.endsWith("/") ? sel : sel + "/")
      )
    );
    if (!selectedEntries.length) {
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
    const newZipBuffer = newZip.toBuffer();
    const newZipName =
      selectedEntries.length === 1 && !selectedEntries[0].isDirectory
        ? selectedEntries[0].name
        : `${fileRecord.original_name.replace(/\.zip$/, "")}_partial.zip`;
    // Update download count in Supabase
    await supabaseAdmin
      .from("zip_metadata")
      .update({
        download_count: (fileRecord.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq("id", fileRecord.id);
    // Log audit event in Supabase
    await supabaseAdmin.from("audit_logs").insert({
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
    // Stream the new ZIP as response
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
      { error: "Selective download failed. Please try again." },
      { status: 500 }
    );
  }
}
