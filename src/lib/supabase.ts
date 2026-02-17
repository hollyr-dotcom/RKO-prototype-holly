import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side only client using service role key (bypasses RLS).
// This module should never be imported from client-side code.
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
