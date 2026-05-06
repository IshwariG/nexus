import { createClient } from '@supabase/supabase-js'

// Safely get the URL. If the user pasted a bad URL (like one missing https://), fall back to placeholder
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
if (!supabaseUrl.startsWith('http')) {
  supabaseUrl = 'https://placeholder.supabase.co';
}
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
