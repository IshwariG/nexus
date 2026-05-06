import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env.local');
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

async function checkDB() {
  const { data: units, error } = await supabase.from('PropertyUnits').select('*');
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Total units: ${units.length}`);
  
  const sold = units.filter(u => u.status === 'SOLD OUT');
  console.log(`Sold units (${sold.length}):`, sold.map(u => u.unit_id));
  
  const invalid = units.filter(u => {
    const id = parseInt(u.unit_id);
    const floor = Math.floor(id / 100);
    const num = id % 100;
    return floor < 1 || floor > 5 || num < 1 || num > 10;
  });
  console.log(`Invalid units not in grid (${invalid.length}):`, invalid.map(u => u.unit_id));
}
checkDB();
