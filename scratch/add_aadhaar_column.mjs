import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ucqdbshwpbcxahswpfzl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjcWRic2h3cGJjeGFoc3dwZnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NjU3NTIsImV4cCI6MjA5MzM0MTc1Mn0.ljyut3_gMNzRVaVLjfKmmP_Atijay_c1wMGyz8r0j54';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
  const sql = `
    ALTER TABLE "Inquiries" ADD COLUMN IF NOT EXISTS "aadhaar" VARCHAR(50);
  `;
  
  console.log('Executing DDL to add column aadhaar to "Inquiries"...');
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.error('Migration failed:', error);
  } else {
    console.log('Migration completed successfully. Result:', data);
  }
}

addColumn();
