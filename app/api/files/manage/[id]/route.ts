import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { BUCKETS } from '@/lib/appwrite';
import { generateId, generateSecureId, getClientIP } from '@/lib/security';
import AdmZip from 'adm-zip';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { virusScanner } from '@/lib/virusScanner';

export const runtime = 'nodejs';

// POST handler: update zip archive
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (request.headers.get('content-type')?.includes('application/json')) {
    const { editToken } = await request.json();
    if (!editToken) {
      return NextResponse.json({ valid: false, error: 'Missing edit token' }, { status: 400 });
    }

    const { data: fileRecord, error } = await supabaseAdmin
      .from('zip_file_metadata')
      .select('edit_token')
      .eq('download_token', id)
      .single();

    if (error || !fileRecord) {
      return NextResponse.json({ valid: false, error: 'File not found' }, { status: 404 });
    }

    if (fileRecord.edit_token !== editToken) {
      return NextResponse.json({ valid: false, error: 'Invalid edit token' }, { status: 403 });
    }

    return NextResponse.json({ valid: true });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const relPaths = formData.getAll('relativePaths') as string[];
    const editToken = formData.get('editToken') as string;
    const filesToDeleteRaw = formData.get('filesToDelete') as string;
    const filesToDelete = filesToDeleteRaw ? JSON.parse(filesToDeleteRaw) : [];

    if (!editToken) {
      return NextResponse.json({ error: 'Missing edit token' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Failed to fetch current zip from storage' }, { status: 500 });
    }

    const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
    const { decryptZipFile } = require('@/lib/security');
    const decryptedZipBuffer = decryptZipFile(zipBuffer, fileRecord.encrypted_key);
    const zip = new AdmZip(decryptedZipBuffer);

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

    let subfileRows: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = relPaths[i];
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const scanResult = await virusScanner.scanBuffer(fileBuffer);
      if (!scanResult.isClean) {
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

    const newZipBuffer = zip.toBuffer();
    const zipName = `archive_${Date.now()}.zip`;
    const newAppwriteId = generateId();

    const { encryptZipFile } = require('@/lib/security');
    const { encrypted, encryptedKey } = encryptZipFile(newZipBuffer);

    const form = new FormData();
    form.append('fileId', newAppwriteId);
    form.append('file', encrypted, { filename: zipName, contentType: 'application/zip' });

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

    const updateFields = {
      appwrite_id: newAppwriteId,
      uploaded_at: new Date().toISOString(),
      uploaded_by: getClientIP(request),
      original_name: zipName,
      encrypted_key: encryptedKey
    };

    const { error: updateError } = await supabaseAdmin
      .from('zip_file_metadata')
      .update(updateFields)
      .eq('id', fileRecord.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update file metadata', details: updateError.message }, { status: 500 });
    }

    await supabaseAdmin.from('zip_subfile_metadata').delete().eq('zip_id', fileRecord.id);

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
        return NextResponse.json({ error: 'Failed to update subfile metadata', details: subfileInsertError.message }, { status: 500 });
      }
    }

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

    await supabaseAdmin.from('audit_logs').insert({
      action: 'file_update',
      resource_type: 'zip',
      resource_id: fileRecord.id,
      ip_address: getClientIP(request),
      metadata: {
        added: subfileRows.map(f => f.file_path),
        deleted: filesToDelete,
        new_zip_name: zipName,
        new_appwrite_id: newAppwriteId
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Unexpected server error', details: err.message }, { status: 500 });
  }
}

// DELETE handler: delete entire zip
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const editToken = body.editToken;

    if (!editToken) {
      return NextResponse.json({ error: 'Missing edit token' }, { status: 400 });
    }

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

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKETS.FILES}/files/${fileRecord.appwrite_id}`,
        {
          method: 'DELETE',
          headers: {
            'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? '',
            'X-Appwrite-Key': process.env.APPWRITE_API_KEY ?? '',
          },
        }
      );
    } catch (err) {
      console.error('Failed to delete file from Appwrite:', err);
    }

    const { error: supabaseDeleteError } = await supabaseAdmin
      .from('zip_file_metadata')
      .delete()
      .eq('id', fileRecord.id);

    if (supabaseDeleteError) {
      return NextResponse.json({ error: 'Failed to delete file metadata', details: supabaseDeleteError.message }, { status: 500 });
    }

    await supabaseAdmin.from('audit_logs').insert({
      action: 'file_deleted',
      resource_type: 'zip',
      resource_id: fileRecord.id,
      ip_address: getClientIP(request),
      metadata: {
        filename: fileRecord.original_name,
        reason: 'user_deleted',
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Unexpected server error', details: err.message }, { status: 500 });
  }
}
