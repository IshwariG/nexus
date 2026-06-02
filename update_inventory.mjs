import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env.local manually
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

async function updateDB() {
  console.log('Fetching units...');
  const { data: units, error } = await supabase.from('PropertyUnits').select('id, unit_id, floor');
  
  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  console.log(`Found ${units.length} units. Updating types and images...`);
  
  for (const unit of units) {
    let type = '3BHK PENTHOUSE';
    let area = '5400 SqFt';
    let price = '₹ 14.25 Cr';
    let img = '/images/unit_interior_1777642600392.png';
    
    const floor = parseInt(unit.floor);
    if (floor === 1 || floor === 2) {
      type = '2BHK ELITE';
      area = '1850 SqFt';
      price = '₹ 4.80 Cr';
    } else if (floor === 3 || floor === 4) {
      type = '3BHK SUPREME';
      area = '2800 SqFt';
      price = '₹ 8.50 Cr';
    }
    
    await supabase.from('PropertyUnits').update({ type, area, price, img }).eq('id', unit.id);
  }
  
  console.log('Successfully updated 2BHK/3BHK/4BHK distribution and fixed images!');
}
updateDB();
