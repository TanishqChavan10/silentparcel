import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    let fileRecord = null;
    let supabaseError = null;
    // Try zip_metadata first
    let res = await supabaseAdmin
      .from('zip_metadata')
      .select('*')
      .eq('download_token', token)
      .single();
    fileRecord = res.data;
    supabaseError = res.error;
    let table = 'zip_metadata';
    if (!fileRecord) {
      // Fallback to files table
      res = await supabaseAdmin
        .from('zip_metadata')
        .select('*')
        .eq('download_token', token)
        .single();
      fileRecord = res.data;
      supabaseError = res.error;
      table = 'files';
    }
    if (supabaseError || !fileRecord) {
      return NextResponse.json({ error: 'File not found or expired' }, { status: 404 });
    }
    if (!fileRecord.is_active) {
      return NextResponse.json({ error: 'File has been deleted' }, { status: 410 });
    }
    if (fileRecord.expiry_date && new Date(fileRecord.expiry_date) < new Date()) {
      return NextResponse.json({ error: 'File has expired' }, { status: 410 });
    }
    // Fetch file/folder tree from zip_subfile_contents if zip_metadata
    let subfiles = [];
    if (table === 'zip_metadata') {
      const { data: subfileData, error: subfileError } = await supabaseAdmin
        .from('zip_subfile_contents')
        .select('file_name, file_path, size, mime_type, file_token, extracted, downloaded_at')
        .eq('zip_id', fileRecord.id);
      if (subfileError) {
        return NextResponse.json({ error: 'Failed to fetch file tree', details: subfileError.message }, { status: 500 });
      }
      subfiles = subfileData || [];
    }
    // Return metadata and file tree
    const metadata = {
      id: fileRecord.id,
      name: fileRecord.original_name || fileRecord.name,
      size: fileRecord.size,
      type: fileRecord.mime_type,
      uploadDate: fileRecord.uploaded_at || fileRecord.created_at,
      downloadCount: fileRecord.download_count,
      maxDownloads: fileRecord.max_downloads,
      expiryDate: fileRecord.expiry_date,
      isPasswordProtected: !!fileRecord.password,
      virusScanStatus: fileRecord.virus_scan_status,
      appwrite_id: fileRecord.appwrite_id,
      isActive: fileRecord.is_active,
      files: subfiles
    };
    return NextResponse.json(metadata);
  } catch (error: any) {
    const stack = typeof error === 'object' && error && 'stack' in error ? error.stack : undefined;
    console.error('[Metadata API] Unexpected error:', error, stack);
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
} 