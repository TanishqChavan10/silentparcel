//  initially i was intending to make a separate endpoint where metadata from supabase
//  would be called and that would be used to verify the downloading details
//  but it was getting chaotic during development so i removed it and call 
//  directly in the download endpoint
//
//
// import { NextRequest, NextResponse } from 'next/server';
// import { supabaseAdmin } from '@/lib/supabase';

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { token: string } }
// ) {
//   try {
//     const { token } = params;
//     console.log('[Metadata API] Received request for token:', token);

//     // Fetch file metadata from Supabase
//     const { data: fileRecord, error: supabaseError } = await supabaseAdmin
//       .from('files')
//       .select('*')
//       .eq('downloadToken', token)
//       .single();

//     if (supabaseError || !fileRecord) {
//       console.warn('[Metadata API] No file found for token:', token, supabaseError);
//       return NextResponse.json({ error: 'File not found or expired' }, { status: 404 });
//     }

//     // Check if file is still active
//     if (!fileRecord.isActive) {
//       console.warn('[Metadata API] File is not active:', fileRecord);
//       return NextResponse.json({ error: 'File has been deleted' }, { status: 410 });
//     }

//     // Check expiry
//     if (fileRecord.expiryDate && new Date(fileRecord.expiryDate) < new Date()) {
//       console.warn('[Metadata API] File has expired:', fileRecord);
//       return NextResponse.json({ error: 'File has expired' }, { status: 410 });
//     }

//     // Return only metadata
//     const metadata = {
//       name: fileRecord.originalName,
//       size: fileRecord.size,
//       type: fileRecord.mimeType,
//       uploadDate: fileRecord.createdAt,
//       downloadCount: fileRecord.downloadCount,
//       maxDownloads: fileRecord.maxDownloads,
//       expiryDate: fileRecord.expiryDate,
//       isPasswordProtected: !!fileRecord.password,
//       virusScanStatus: fileRecord.virusScanStatus,
//     };
//     console.log('[Metadata API] Returning metadata:', metadata);
//     return NextResponse.json(metadata);
//   } catch (error: any) {
//     const stack = typeof error === 'object' && error && 'stack' in error ? error.stack : undefined;
//     console.error('[Metadata API] Unexpected error:', error, stack);
//     return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
//   }
// } 