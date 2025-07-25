// scripts/cleanup-expired-files.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanup() {
  const now = new Date().toISOString();
  // 1. Find expired or over-limit files
  const { data: files, error } = await supabase
    .from('zip_file_metadata')
    .select('*')
    .or(`expiry_date.lt.${now},download_count.gte.max_downloads`)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching files:', error);
    return;
  }

  for (const file of files) {
    try {
      // Delete from Appwrite
      await fetch(
        `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.BUCKETS_FILES}/files/${file.appwrite_id}`,
        {
          method: 'DELETE',
          headers: {
            'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
            'X-Appwrite-Key': process.env.APPWRITE_API_KEY,
          },
        }
      );
      // Delete from Supabase
      await supabase.from('zip_file_metadata').delete().eq('id', file.id);
      // Audit log
      await supabase.from('audit_logs').insert({
        action: 'file_deleted',
        resource_type: 'zip',
        resource_id: file.id,
        metadata: {
          filename: file.original_name,
          reason: 'expired_or_limit',
        },
      });
      console.log(`Deleted file ${file.id}`);
    } catch (err) {
      console.error('Error deleting file:', file.id, err);
    }
  }
}

cleanup();
