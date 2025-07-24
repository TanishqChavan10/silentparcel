import { NextRequest, NextResponse } from 'next/server';
import { databases, storage, ID, DATABASE_ID, COLLECTIONS, BUCKETS } from '@/lib/appwrite';
import { fileUploadRateLimiter } from '@/lib/middleware/rateLimiter';
import { generateId, generateSecureId, validateFileType, validateFileSize, getClientIP, getAllowedTypes } from '@/lib/security';
import { supabaseAdmin } from '@/lib/supabase';
import redis, { REDIS_KEYS, setWithExpiry } from '@/lib/redis';
import { virusScanner } from '@/lib/virusScanner';
import { logger } from '@/lib/logger';
import FormData from 'form-data';
import fetch from 'node-fetch';
import AdmZip from 'adm-zip';

export async function POST(request: NextRequest) {
  // Check environment configuration
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' ||
    !process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT === 'https://placeholder.appwrite.io/v1') {
    return NextResponse.json(
      { error: 'Service not properly configured' },
      { status: 503 }
    );
  }

  try {
    // Rate limiting
    // const rateLimitResult = await fileUploadRateLimiter.isAllowed(request);
    // if (!rateLimitResult.allowed) {
    //   return NextResponse.json(
    //     { error: 'Too many upload attempts. Please try again later.' },
    //     { status: 429 }
    //   );
    // }    // check: keeping it off for development perspective, preventing multiple file uploads

    const formData = await request.formData();
    // Debug: log all formData keys and values
    const debugEntries = Array.from(formData.entries());
    console.log('FormData entries:', debugEntries.map(([k, v]) => [k, v instanceof File ? v.name : v]));
    const files = formData.getAll('files') as File[];
    let relPaths = formData.getAll('relativePaths') as string[];
    console.log('Number of files received:', files.length);
    if (files.length > 0) {
      console.log('File types:', files.map(f => typeof f));
      console.log('File names:', files.map(f => f && f.name));
    }
    const password = formData.get('password') as string;
    const expiresIn = formData.get('expiresIn') as string;
    const maxDownloadsRaw = formData.get('maxDownloads');
    let maxDownloads = 10;   // default downloads would be 10
    if (maxDownloadsRaw !== null && maxDownloadsRaw !== undefined) {
      const parsed = parseInt(String(maxDownloadsRaw), 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 20) {
        maxDownloads = parsed;
      }
    }
    const captchaToken = formData.get('captchaToken') as string;

    if (!files || files.length === 0) {
      // Debug: log all formData entries if no files found
      console.error('No files provided. FormData entries:', debugEntries);
      return NextResponse.json(
        { error: 'No files provided', debug: debugEntries },
        { status: 400 }
      );
    }
    // Fallback: if relPaths is missing or count mismatch, use file.name for each file
    if (!relPaths || relPaths.length !== files.length) {
      relPaths = files.map(f => (f as any).webkitRelativePath || f.name);
    }

    if (!relPaths || relPaths.length !== files.length) {
      return NextResponse.json(
        { error: 'Relative paths missing or count mismatch' },
        { status: 400 }
      );
    }

    // Verify CAPTCHA   //check : for development purpose its turned off, switch on for production
    // if (!captchaToken) {
    //   return NextResponse.json(
    //     { error: 'CAPTCHA verification required' },
    //     { status: 400 }
    //   );
    // }

    // const captchaResponse = await fetch('https://hcaptcha.com/siteverify', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: `secret=${process.env.HCAPTCHA_SECRET_KEY}&response=${captchaToken}`
    // });

    // const captchaData = await captchaResponse.json() as { success: boolean; [key: string]: any };
    // if (!captchaData.success) {
    //   return NextResponse.json(
    //     { error: 'CAPTCHA verification failed' },
    //     { status: 400 }
    //   );
    // }

    // Validate file
    // Validate file type and size
    const allowedTypes = getAllowedTypes();
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '104857600');
    let totalSize = 0;
    const subfileMetadata: any[] = [];
    const fileBuffers: Buffer[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = relPaths[i];
      if (!validateFileType(file.name, file.type, allowedTypes)) {
        return NextResponse.json(
          { error: `File type not allowed: ${file.name}` },
          { status: 400 }
        );
      }
      if (!validateFileSize(file.size, maxSize)) {
        return NextResponse.json(
          { error: `File size exceeds limit: ${file.name}` },
          { status: 400 }
        );
      }
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      // Virus scan each file
      const scanResult = await virusScanner.scanBuffer(fileBuffer);
      if (!scanResult.isClean) {
        await supabaseAdmin.from('audit_logs').insert({
          action: 'virus_detected',
          resource_type: 'file',
          resource_id: relPath,
          ip_address: getClientIP(request),
          user_agent: request.headers.get('user-agent'),
          metadata: {
            filename: file.name,
            signature: scanResult.signature,
            message: scanResult.message
          }
        });
        return NextResponse.json(
          { error: `File contains malicious content: ${file.name}` },
          { status: 400 }
        );
      }
      totalSize += file.size;
      fileBuffers.push(fileBuffer);
      subfileMetadata.push({
        file_name: file.name,
        file_path: relPath,
        size: file.size,
        mime_type: file.type,
      });
    }

    // Create ZIP archive in-memory
    const zip = new AdmZip();
    for (let i = 0; i < files.length; i++) {
      zip.addFile(relPaths[i], fileBuffers[i]);
    }
    const zipBuffer = zip.toBuffer();
    const zipName = `archive_${Date.now()}.zip`;

    // Encrypt the ZIP buffer
    const { encryptZipFile } = require('@/lib/security');
    const { encrypted, encryptedKey } = encryptZipFile(zipBuffer);

    // Upload encrypted ZIP to Appwrite
    const fileId = generateId();
    const downloadToken = generateSecureId();
    const editToken = generateSecureId();
    const form = new FormData();
    form.append('fileId', fileId);
    form.append('file', encrypted, { filename: zipName, contentType: 'application/zip' });
    const res = await fetch(`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKETS.FILES}/files`, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? '',
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY ?? '', // Must be a server API key
        ...form.getHeaders()
      },
      body: form
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Appwrite upload failed:', errText);
      return NextResponse.json(
        { error: 'Appwrite upload failed', details: errText },
        { status: 500 }
      );
    }
    let uploadedFile : any = await res.json();

    // Calculate expiry
    const expiryDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

    // Store file metadata in Supabase, including Appwrite file UID and encryptedKey
    const { data: fileRecord, error: fileInsertError } = await supabaseAdmin.from('zip_file_metadata').insert([
      {
        original_name: zipName,
        size: encrypted.length,
        mime_type: 'application/zip',
        download_token: downloadToken,
        edit_token: editToken,
        password: password || null,
        expiry_date: expiryDate,
        max_downloads: maxDownloads,
        download_count: 0,
        is_active: true,
        uploaded_at: new Date().toISOString(),
        uploaded_by: getClientIP(request),
        appwrite_id: uploadedFile.$id, // Store Appwrite file UID
        encrypted_key: encryptedKey // Store encrypted AES key
      }
    ]).select().single();
    if (fileInsertError) {
      logger.error('Supabase file insert error:', fileInsertError);
      return NextResponse.json(
        { error: 'Failed to save file metadata in Supabase', details: fileInsertError.message },
        { status: 500 }
      );
    }
    const zipId = fileRecord.id;

    // Store subfile metadata in Supabase
    const subfileRows = subfileMetadata.map(meta => ({
      zip_id: zipId,
      file_name: meta.file_name,
      file_path: meta.file_path,
      size: meta.size,
      mime_type: meta.mime_type,
      file_token: generateSecureId(),
      extracted: false,
      // downloaded_at: null
    }));
    const { error: subfileInsertError } = await supabaseAdmin.from('zip_subfile_metadata').insert(subfileRows);
    if (subfileInsertError) {
      logger.error('Supabase subfile insert error:', subfileInsertError);
      return NextResponse.json(
        { error: 'Failed to save subfile metadata in Supabase', details: subfileInsertError.message },
        { status: 500 }
      );
    }

    // Log audit event
    await supabaseAdmin.from('audit_logs').insert({
      action: 'file_upload',
      resource_type: 'zip',
      resource_id: zipId,
      ip_address: getClientIP(request),
      user_agent: request.headers.get('user-agent'),
      metadata: {
        filename: zipName,
        size: encrypted.length,
        mimeType: 'application/zip',
        subfiles: subfileMetadata.length
      }
    });

    // Store tokens in Redis for quick access
    await setWithExpiry(
      REDIS_KEYS.FILE_UPLOAD(downloadToken),
      JSON.stringify({ fileId, editToken }),
      24 * 60 * 60 // 24 hours
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const downloadUrl = `${baseUrl}/files/${downloadToken}`;
    const editUrl = `${baseUrl}/files/manage/${editToken}`;

    return NextResponse.json({
      success: true,
      downloadUrl,
      editUrl,
      zipId,
      subfiles: subfileMetadata.map((meta, idx) => ({ ...meta, file_token: subfileRows[idx].file_token }))
    });
  } catch (err: any) {
    logger.error('Upload error:', err);
    return NextResponse.json(
      { error: 'Unexpected server error', details: err.message },
      { status: 500 }
    );
  }
}
