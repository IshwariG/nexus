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
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTypes() {
  const { data: units, error } = await supabase.from('PropertyUnits').select('unit_id, type, status');
  if (error) {
    console.error("Error:", error);
    return;
  }
  const counts = {};
  units.forEach(u => {
    counts[u.type] = (counts[u.type] || 0) + 1;
  });
  console.log("Unit Type Counts:", counts);
  console.log("Units of type 4BHK PENTHOUSE:", units.filter(u => u.type === '4BHK PENTHOUSE'));
}
checkTypes();
