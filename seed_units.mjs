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

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const units = [];
  // 5 levels, 10 units each (101-110, 201-210, etc.)
  for(let lvl = 1; lvl <= 5; lvl++) {
    for(let i = 1; i <= 10; i++) {
      const unitId = lvl * 100 + i;
      units.push({
        unit_id: unitId.toString(),
        floor: lvl.toString(),
        type: '4BHK PENTHOUSE',
        area: '5400',
        price: '₹ 14.25 Cr',
        status: 'AVAILABLE',
        img: '/images/hero_slider_2_1777798109562.png'
      });
    }
  }
  
  const { data, error } = await supabase.from('PropertyUnits').upsert(units, { onConflict: 'unit_id' });
  if (error) {
    console.error("Seed error:", error);
  } else {
    console.log("Seeded units successfully!");
  }
}

seed();
