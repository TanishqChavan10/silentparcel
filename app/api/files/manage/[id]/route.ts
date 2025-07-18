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
    console.log('[Step 1] Start processing update request');
    const { id } = params;
    console.log('[Step 0] Received id:', id);
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const relPaths = formData.getAll('relativePaths') as string[];
    const editToken = formData.get('editToken') as string;
    if (!editToken) {
      console.log('[Step 2] Missing edit token');
      return NextResponse.json({ error: 'Missing edit token' }, { status: 400 });
    }
    if (!files || files.length === 0) {
      console.log('[Step 3] No files provided');
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    // Fetch the file record by download_token (or edit_token)
    console.log('[Step 4] Fetching file record');
    const { data: fileRecord, error: fetchError } = await supabaseAdmin
      .from('zip_file_metadata')
      .select('*')
      .eq('download_token', id)
      .single();
    if (fetchError || !fileRecord) {
      console.log('[Step 5] File not found');
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    if (fileRecord.edit_token !== editToken) {
      console.log('[Step 6] Invalid edit token');
      return NextResponse.json({ error: 'Invalid edit token' }, { status: 403 });
    }
    // Virus scan all files
    let fileBuffers: Buffer[] = [];
    let subfileRows: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = relPaths[i];
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      console.log(`[Step 7] Virus scanning file: ${file.name}`);
      const scanResult = await virusScanner.scanBuffer(fileBuffer);
      if (!scanResult.isClean) {
        console.log(`[Step 8] Virus detected in file: ${file.name}`);
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
    console.log('[Step 9] Creating ZIP archive');
    const zip = new AdmZip();
    for (let i = 0; i < files.length; i++) {
      zip.addFile(relPaths[i], fileBuffers[i]);
    }
    const zipBuffer = zip.toBuffer();
    const zipName = `archive_${Date.now()}.zip`;
    // Upload new ZIP to Appwrite
    console.log('[Step 10] Uploading ZIP to Appwrite');
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
      console.log('[Step 11] Appwrite upload failed');
      return NextResponse.json({ error: 'Appwrite upload failed', details: errText }, { status: 500 });
    }
    // Update zip_file_metadata with new file info
    console.log('[Step 12] Updating zip_file_metadata');
    const updateFields = {
      appwrite_id: newAppwriteId,
      uploaded_at: new Date().toISOString(),
      uploaded_by: getClientIP(request),
      original_name: zipName,
      size: zipBuffer.length,
      mime_type: 'application/zip'
    };
    const { error: updateError } = await supabaseAdmin
      .from('zip_file_metadata')
      .update(updateFields)
      .eq('id', fileRecord.id);
    if (updateError) {
      console.log('[Step 13] Failed to update file metadata');
      return NextResponse.json({ error: 'Failed to update file metadata', details: updateError.message }, { status: 500 });
    }
    // Delete old subfile metadata
    console.log('[Step 14] Deleting old subfile metadata');
    await supabaseAdmin.from('zip_subfile_metadata').delete().eq('zip_id', fileRecord.id);
    // Insert new subfile metadata
    if (subfileRows.length > 0) {
      console.log('[Step 15] Inserting new subfile metadata');
      const { error: subfileInsertError } = await supabaseAdmin.from('zip_subfile_metadata').insert(subfileRows);
      if (subfileInsertError) {
        console.log('[Step 16] Failed to update subfile metadata');
        return NextResponse.json({ error: 'Failed to update subfile metadata', details: subfileInsertError.message }, { status: 500 });
      }
    }
    console.log('[Step 17] Update successful');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.log('[Step 99] Unexpected server error', err);
    return NextResponse.json({ error: 'Unexpected server error', details: err.message }, { status: 500 });
  }
} 