import { NextRequest, NextResponse } from 'next/server';
import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKETS } from '@/lib/appwrite';
import { verifyPassword, getClientIP } from '@/lib/security';
import { supabaseAdmin } from '@/lib/supabase';
import redis, { REDIS_KEYS } from '@/lib/redis';

// Check if we're in a proper environment
function isProperlyConfigured() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
         process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
         process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT !== 'https://placeholder.appwrite.io/v1';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  // Check environment configuration
  if (!isProperlyConfigured()) {
    return NextResponse.json(
      { error: 'Service not properly configured' },
      { status: 503 }
    );
  }

  try {
    const { token } = params;
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    // First try to get file info from Redis
    let fileInfo = await redis.get(REDIS_KEYS.FILE_UPLOAD(token));
    let fileRecord;

    if (fileInfo) {
      const { fileId } = JSON.parse(fileInfo);
      fileRecord = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.FILES,
        fileId
      );
    } else {
      // Fallback to database lookup
      const files = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FILES,
        [`downloadToken=${token}`]
      );

      if (files.documents.length === 0) {
        return NextResponse.json(
          { error: 'File not found or expired' },
          { status: 404 }
        );
      }

      fileRecord = files.documents[0];
    }

    // Check if file is still active
    if (!fileRecord.isActive) {
      return NextResponse.json(
        { error: 'File has been deleted' },
        { status: 410 }
      );
    }

    // Check expiry
    if (fileRecord.expiryDate && new Date(fileRecord.expiryDate) < new Date()) {
      return NextResponse.json(
        { error: 'File has expired' },
        { status: 410 }
      );
    }

    // Check download limit
    if (fileRecord.maxDownloads && fileRecord.downloadCount >= fileRecord.maxDownloads) {
      return NextResponse.json(
        { error: 'Download limit exceeded' },
        { status: 410 }
      );
    }

    // Check password if required
    if (fileRecord.password) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password required', requiresPassword: true },
          { status: 401 }
        );
      }

      const isValidPassword = await verifyPassword(password, fileRecord.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        );
      }
    }

    // Get file from storage
    const fileUrl = await storage.getFileDownload(BUCKETS.FILES, fileRecord.$id);
    let fileBuffer;
    if (typeof fileUrl === 'string') {
      // Fetch the file data from the URL
      const fetchRes = await fetch(fileUrl);
      fileBuffer = Buffer.from(await fetchRes.arrayBuffer());
    } else if (fileUrl instanceof Buffer) {
      fileBuffer = fileUrl;
    } else {
      throw new Error('Unexpected file download response');
    }

    // Update download count
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.FILES,
      fileRecord.$id,
      {
        downloadCount: fileRecord.downloadCount + 1,
        lastDownloadedAt: new Date().toISOString()
      }
    );

    // Log audit event
    await supabaseAdmin.from('audit_logs').insert({
      action: 'file_download',
      resource_type: 'file',
      resource_id: fileRecord.$id,
      ip_address: getClientIP(request),
      user_agent: request.headers.get('user-agent'),
      metadata: {
        filename: fileRecord.originalName,
        downloadCount: fileRecord.downloadCount + 1
      }
    });

    // Return file
    const response = new NextResponse(fileBuffer);
    response.headers.set('Content-Type', fileRecord.mimeType);
    response.headers.set('Content-Disposition', `attachment; filename="${fileRecord.originalName}"`);
    
    return response;

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Download failed. Please try again.' },
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
