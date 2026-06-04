const { createClient } = require('c:/Users/lenovo/OneDrive/Documents/neus/nexus/node_modules/@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('c:/Users/lenovo/OneDrive/Documents/neus/nexus/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const sql = `
    ALTER TABLE "BuyerDetails" 
    ADD COLUMN IF NOT EXISTS "construction_updates" JSONB DEFAULT '[]'::jsonb;
  `;
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  console.log('Result:', data, error);
}
run();
