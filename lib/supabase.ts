import { createClient } from '@supabase/supabase-js';

// Environment variables with safe fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'example-service-key';

// Create clients with proper error handling
let supabase: any = null;
let supabaseAdmin: any = null;

try {
  // Client for public operations
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Admin client for server-side operations
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} catch (error) {
  console.warn('Supabase client initialization failed:', error);
  // Create mock clients for build time
  supabase = {
    from: () => ({ insert: () => Promise.resolve(), select: () => Promise.resolve([]) })
  };
  supabaseAdmin = {
    from: () => ({ insert: () => Promise.resolve(), select: () => Promise.resolve([]) })
  };
}

export { supabase, supabaseAdmin };

// Types for audit logs
export interface AuditLog {
  id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  user_id?: string;
  ip_address?: string;
  // user_agent?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}
