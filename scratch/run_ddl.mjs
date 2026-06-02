import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ucqdbshwpbcxahswpfzl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjcWRic2h3cGJjeGFoc3dwZnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NjU3NTIsImV4cCI6MjA5MzM0MTc1Mn0.ljyut3_gMNzRVaVLjfKmmP_Atijay_c1wMGyz8r0j54';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runDdl() {
  const sql = `
    CREATE TABLE IF NOT EXISTS "Opportunities" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inquiry_id UUID NOT NULL,
        walk_in_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        tag_start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        tag_end_date TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '30 days') NOT NULL,
        cp_username VARCHAR(255),
        status VARCHAR(50) DEFAULT 'QUALIFIED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  `;
  
  // Try executing via a general sql RPC if it exists
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  console.log('Result:', data, error);
}

runDdl();
