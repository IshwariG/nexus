import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
  const rpcNames = ['run_sql', 'sql', 'execute_sql', 'query', 'exec'];
  const query = 'SELECT 1;';
  
  for (const name of rpcNames) {
    try {
      const { data, error } = await supabase.rpc(name, { query: query, sql_query: query, sql: query });
      if (error) {
        console.log(`RPC ${name} failed:`, error.message);
      } else {
        console.log(`RPC ${name} SUCCEEDED:`, data);
      }
    } catch (e) {
      console.log(`RPC ${name} threw error:`, e.message);
    }
  }
}

testRpc();
