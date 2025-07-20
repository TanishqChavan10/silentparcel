import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { storage, BUCKETS } from '@/lib/appwrite';
import { generateId, generateSecureId, getClientIP } from '@/lib/security';
import AdmZip from 'adm-zip';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { virusScanner } from '@/lib/virusScanner';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const relPaths = formData.getAll('relativePaths') as string[];
    const editToken = formData.get('editToken') as string;
    const filesToDeleteRaw = formData.get('filesToDelete') as string;
    const filesToDelete = filesToDeleteRaw ? JSON.parse(filesToDeleteRaw) : [];
    if (!editToken) {
      return NextResponse.json({ error: 'Missing edit token' }, { status: 400 });
    }
    // Fetch the file record by download_token (or edit_token)
    const { data: fileRecord, error: fetchError } = await supabaseAdmin
      .from('zip_file_metadata')
      .select('*')
      .eq('download_token', id)
      .single();
    if (fetchError || !fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    if (fileRecord.edit_token !== editToken) {
      return NextResponse.json({ error: 'Invalid edit token' }, { status: 403 });
    }
    // Handle deletions (even if no new files)
    if (filesToDelete.length > 0) {
      await supabaseAdmin.from('zip_subfile_metadata').delete().in('file_token', filesToDelete);
    }
    // If no new files, just process deletions
    if (!files || files.length === 0) {
      return NextResponse.json({ success: true, deleted: filesToDelete.length });
    }
    // Virus scan all files
    let fileBuffers: Buffer[] = [];
    let subfileRows: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = relPaths[i];
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const scanResult = await virusScanner.scanBuffer(fileBuffer);
      if (!scanResult.isClean) {
        return NextResponse.json({ error: `File contains malicious content: ${file.name}` }, { status: 400 });
      }
      fileBuffers.push(fileBuffer);
      subfileRows.push({
        zip_id: fileRecord.id,
        file_name: file.name,
        file_path: relPath,
        size: file.size,
        mime_type: file.type,
        file_token: generateSecureId(),
        extracted: false
      });
    }
    // Create ZIP archive in-memory
    const zip = new AdmZip();
    for (let i = 0; i < files.length; i++) {
      zip.addFile(relPaths[i], fileBuffers[i]);
    }
    const zipBuffer = zip.toBuffer();
    const zipName = `archive_${Date.now()}.zip`;
    // Upload new ZIP to Appwrite
    const newAppwriteId = generateId();
    const form = new FormData();
    form.append('fileId', newAppwriteId);
    form.append('file', zipBuffer, { filename: zipName, contentType: 'application/zip' });
    const res = await fetch(`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKETS.FILES}/files`, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? '',
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY ?? '',
        ...form.getHeaders()
      },
      body: form
    });
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: 'Appwrite upload failed', details: errText }, { status: 500 });
    }
    // Update zip_file_metadata with new file info (only selected columns)
    const updateFields = {
      appwrite_id: newAppwriteId,
      uploaded_at: new Date().toISOString(),
      uploaded_by: getClientIP(request),
      original_name: zipName
    };
    const { error: updateError } = await supabaseAdmin
      .from('zip_file_metadata')
      .update(updateFields)
      .eq('id', fileRecord.id);
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update file metadata', details: updateError.message }, { status: 500 });
    }
    // Delete old subfile metadata if new files are uploaded
    await supabaseAdmin.from('zip_subfile_metadata').delete().eq('zip_id', fileRecord.id);
    // Insert new subfile metadata
    if (subfileRows.length > 0) {
      const { error: subfileInsertError } = await supabaseAdmin.from('zip_subfile_metadata').insert(subfileRows);
      if (subfileInsertError) {
        return NextResponse.json({ error: 'Failed to update subfile metadata', details: subfileInsertError.message }, { status: 500 });
      }
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Unexpected server error', details: err.message }, { status: 500 });
  }
} 