import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ucqdbshwpbcxahswpfzl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjcWRic2h3cGJjeGFoc3dwZnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NjU3NTIsImV4cCI6MjA5MzM0MTc1Mn0.ljyut3_gMNzRVaVLjfKmmP_Atijay_c1wMGyz8r0j54';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  const tables = ['Opportunities', 'CallLogs', 'SourcingMetrics', 'Referrals', 'SupportTickets'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table ${table}: NOT PRESENT / ERROR (${error.message})`);
    } else {
      console.log(`Table ${table}: PRESENT`);
    }
  }
}
testTables();
