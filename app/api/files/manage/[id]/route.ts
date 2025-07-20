import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { storage, BUCKETS } from '@/lib/appwrite';
import { generateId, generateSecureId, getClientIP } from '@/lib/security';
import AdmZip from 'adm-zip';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { virusScanner } from '@/lib/virusScanner';

export const runtime = 'nodejs';

// Handles POST requests to update a zip archive: add, delete, or replace files in the archive
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('File manage route: Start POST handler');
  try {
    const { id } = params;
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const relPaths = formData.getAll('relativePaths') as string[];
    const editToken = formData.get('editToken') as string;
    const filesToDeleteRaw = formData.get('filesToDelete') as string;
    const filesToDelete = filesToDeleteRaw ? JSON.parse(filesToDeleteRaw) : [];

    if (!editToken) {
      console.log('Missing edit token');
      return NextResponse.json({ error: 'Missing edit token' }, { status: 400 });
    }

    // Fetch the file record by download_token (or edit_token)
    console.log('Fetching file record from database');
    const { data: fileRecord, error: fetchError } = await supabaseAdmin
      .from('zip_file_metadata')
      .select('*')
      .eq('download_token', id)
      .single();
    if (fetchError || !fileRecord) {
      console.log('File not found');
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    if (fileRecord.edit_token !== editToken) {
      console.log('Invalid edit token');
      return NextResponse.json({ error: 'Invalid edit token' }, { status: 403 });
    }

    // Download the current zip from Appwrite
    console.log('Downloading current zip from Appwrite');
    const oldAppwriteId = fileRecord.appwrite_id;
    const zipRes = await fetch(
      `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKETS.FILES}/files/${oldAppwriteId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`,
      {
        headers: {
          'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? '',
          'X-Appwrite-Key': process.env.APPWRITE_API_KEY ?? '',
        },
      }
    );
    if (!zipRes.ok) {
      console.log('Failed to fetch current zip from storage');
      return NextResponse.json({ error: 'Failed to fetch current zip from storage' }, { status: 500 });
    }
    const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
    const zip = new AdmZip(zipBuffer);

    // Remove files marked for deletion
    if (filesToDelete.length > 0) {
      console.log('Removing files marked for deletion');
    }
    for (const fileToken of filesToDelete) {
      const { data: subfile } = await supabaseAdmin
        .from('zip_subfile_metadata')
        .select('file_path')
        .eq('file_token', fileToken)
        .single();
      if (subfile && subfile.file_path) {
        zip.deleteFile(subfile.file_path);
      }
    }

    // Add new files/folders (with virus scan)
    let subfileRows: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = relPaths[i];
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      console.log(`Scanning file for viruses: ${file.name}`);
      const scanResult = await virusScanner.scanBuffer(fileBuffer);
      if (!scanResult.isClean) {
        console.log(`File contains malicious content: ${file.name}`);
        return NextResponse.json({ error: `File contains malicious content: ${file.name}` }, { status: 400 });
      }
      zip.addFile(relPath, fileBuffer);
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

    // Prepare new zip buffer
    console.log('Preparing new zip buffer');
    const newZipBuffer = zip.toBuffer();
    const zipName = `archive_${Date.now()}.zip`;
    const newAppwriteId = generateId();

    // Upload new zip to Appwrite
    console.log('Uploading new zip to Appwrite');
    const form = new FormData();
    form.append('fileId', newAppwriteId);
    form.append('file', newZipBuffer, { filename: zipName, contentType: 'application/zip' });
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
      console.log('Appwrite upload failed');
      return NextResponse.json({ error: 'Appwrite upload failed', details: errText }, { status: 500 });
    }

    // Update zip_file_metadata with new file info
    console.log('Updating file metadata in database');
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
      console.log('Failed to update file metadata');
      return NextResponse.json({ error: 'Failed to update file metadata', details: updateError.message }, { status: 500 });
    }

    // Delete all old subfile metadata for this zip
    console.log('Deleting old subfile metadata');
    await supabaseAdmin.from('zip_subfile_metadata').delete().eq('zip_id', fileRecord.id);

    // Insert new subfile metadata (for all files in the zip)
    // Re-scan the zip to get all files and their info
    console.log('Inserting new subfile metadata');
    const zipEntries = zip.getEntries();
    const allSubfileRows = zipEntries
      .filter(entry => !entry.isDirectory)
      .map(entry => {
        const newRow = subfileRows.find(row => row.file_path === entry.entryName);
        if (newRow) return newRow;
        return {
          zip_id: fileRecord.id,
          file_name: entry.name,
          file_path: entry.entryName,
          size: entry.header.size,
          mime_type: '',
          file_token: generateSecureId(),
          extracted: false
        };
      });
    if (allSubfileRows.length > 0) {
      const { error: subfileInsertError } = await supabaseAdmin.from('zip_subfile_metadata').insert(allSubfileRows);
      if (subfileInsertError) {
        console.log('Failed to update subfile metadata');
        return NextResponse.json({ error: 'Failed to update subfile metadata', details: subfileInsertError.message }, { status: 500 });
      }
    }

    // Delete the old zip from Appwrite
    console.log('Deleting old zip from Appwrite');
    await fetch(
      `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKETS.FILES}/files/${oldAppwriteId}`,
      {
        method: 'DELETE',
        headers: {
          'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? '',
          'X-Appwrite-Key': process.env.APPWRITE_API_KEY ?? '',
        },
      }
    );

    // Audit log for update
    console.log('Writing audit log for file update');
    await supabaseAdmin.from('audit_logs').insert({
      action: 'file_update',
      resource_type: 'zip',
      resource_id: fileRecord.id,
      ip_address: getClientIP(request),
      user_agent: request.headers.get('user-agent'),
      metadata: {
        added: subfileRows.map(f => f.file_path),
        deleted: filesToDelete,
        new_zip_name: zipName,
        new_appwrite_id: newAppwriteId
      }
    });

    console.log('File update successful');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.log('Unexpected server error');
    return NextResponse.json({ error: 'Unexpected server error', details: err.message }, { status: 500 });
  }
} 