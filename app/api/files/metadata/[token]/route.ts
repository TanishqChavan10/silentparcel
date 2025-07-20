import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Handles GET requests to fetch file or zip metadata and file tree by token
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  console.log('Metadata route: Start GET handler');
  try {
    const { token } = params;
    let fileRecord = null;
    let supabaseError = null;
    // Try zip_file_metadata first
    console.log('Fetching file metadata from zip_file_metadata');
    let res = await supabaseAdmin
      .from('zip_file_metadata')
      .select('*')
      .eq('download_token', token)
      .single();
    fileRecord = res.data;
    supabaseError = res.error;
    let table = 'zip_file_metadata';
    if (!fileRecord) {
      // Fallback to files table
      console.log('File not found in zip_file_metadata, checking files table');
      res = await supabaseAdmin
        .from('zip_file_metadata')
        .select('*')
        .eq('download_token', token)
        .single();
      fileRecord = res.data;
      supabaseError = res.error;
      table = 'files';
    }
    if (supabaseError || !fileRecord) {
      console.log('File not found or expired');
      return NextResponse.json({ error: 'File not found or expired' }, { status: 404 });
    }
    if (!fileRecord.is_active) {
      console.log('File has been deleted');
      return NextResponse.json({ error: 'File has been deleted' }, { status: 410 });
    }
    if (fileRecord.expiry_date && new Date(fileRecord.expiry_date) < new Date()) {
      console.log('File has expired');
      return NextResponse.json({ error: 'File has expired' }, { status: 410 });
    }
    // Fetch file/folder tree from zip_subfile_metadata if zip_file_metadata
    let subfiles = [];
    if (table === 'zip_file_metadata') {
      console.log('Fetching subfile metadata from zip_subfile_metadata');
      const { data: subfileData, error: subfileError } = await supabaseAdmin
        .from('zip_subfile_metadata')
        .select('file_name, file_path, size, mime_type, file_token, extracted, downloaded_at')
        .eq('zip_id', fileRecord.id);
      if (subfileError) {
        console.log('Failed to fetch file tree');
        return NextResponse.json({ error: 'Failed to fetch file tree', details: subfileError.message }, { status: 500 });
      }
      subfiles = subfileData || [];
    }
    // Return metadata and file tree
    console.log('Returning file metadata and file tree');
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