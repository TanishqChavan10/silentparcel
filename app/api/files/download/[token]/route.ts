import { NextRequest, NextResponse } from "next/server";
import { storage, BUCKETS } from "@/lib/appwrite";
import { verifyPassword, getClientIP } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";
// import AdmZip from 'adm-zip';

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

    // Fetch file metadata from Supabase
    const { data: fileRecord, error: supabaseError } = await supabaseAdmin
      .from("files")
      .select("*")
      .eq("download_token", token)
      .single();

    if (supabaseError || !fileRecord) {
      return NextResponse.json(
        { error: "File not found or expired" },
        { status: 404 }
      );
    }

    // Check if file is still active
    if (!fileRecord.is_active) {
      return NextResponse.json(
        { error: "File has been deleted" },
        { status: 410 }
      );
    }

    // Check expiry
    if (
      fileRecord.expiry_date &&
      new Date(fileRecord.expiry_date) < new Date()
    ) {
      return NextResponse.json({ error: "File has expired" }, { status: 410 });
    }

    // Check download limit
    if (
      fileRecord.max_downloads &&
      fileRecord.download_count >= fileRecord.max_downloads
    ) {
      return NextResponse.json(
        { error: "Download limit exceeded" },
        { status: 410 }
      );
    }

    // If meta=1, return metadata as JSON (do not include password)
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
        isActive: fileRecord.is_active,
        files: fileRecord.files || undefined // Add files property if present
      };
      return NextResponse.json(metadata);
    }

    // Check password if required
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

    // Get Appwrite file UID from Supabase
    const appwriteId = fileRecord.appwrite_id;
    if (!appwriteId) {
      return NextResponse.json(
        { error: "File storage reference missing" },
        { status: 500 }
      );
    }

    // Get file from Appwrite storage
    // const fileUrl = await storage.getFileDownload(BUCKETS.FILES, appwriteId);
    // let fileBuffer;
    // if (typeof fileUrl === 'string') {
    //   const fetchRes = await fetch(fileUrl);
    //   fileBuffer = Buffer.from(await fetchRes.arrayBuffer());
    // } else if (fileUrl instanceof Buffer) {
    //   fileBuffer = fileUrl;
    // } else {
    //   throw new Error('Unexpected file download response');
    // }

    // Update download count in Supabase
    await supabaseAdmin
      .from("files")
      .update({
        download_count: (fileRecord.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq("id", fileRecord.id);

    // Log audit event in Supabase
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

    // Return file
    // const response = new NextResponse(fileBuffer);
    // response.headers.set('Content-Type', fileRecord.mime_type);
    // response.headers.set('Content-Disposition', `attachment; filename=\"${fileRecord.original_name}\"`);

    const fileStream = await storage.getFileDownload(BUCKETS.FILES, appwriteId);

    const response = new NextResponse(fileStream as any); // Next.js expects a body, streams are supported in Node.js
    response.headers.set("Content-Type", fileRecord.mime_type);
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${fileRecord.original_name}"`
    );

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
  // Handle password verification for protected files
  return GET(request, { params });
}
