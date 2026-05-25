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
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Seeding Channel Partner (cp101) ---');
  
  // 1. Insert User account into Users
  const { data: userCreated, error: userError } = await supabase
    .from('Users')
    .upsert([
      { username: 'cp101', password: 'password123', role: 'ChannelPartner' }
    ], { onConflict: 'username' });

  if (userError) {
    console.error('Error inserting User:', userError.message);
  } else {
    console.log('Successfully upserted user account: cp101 / password123');
  }

  // 2. Insert CP Profile into CP_Partners (if table exists)
  try {
    const { data: cpCreated, error: cpError } = await supabase
      .from('CP_Partners')
      .upsert([
        { 
          username: 'cp101', 
          firm_name: 'Apex Luxury Realty', 
          rera_number: 'RERA-MUM-98765-CP', 
          commission_rate: 2.50 
        }
      ], { onConflict: 'username' });

    if (cpError) {
      console.warn('Could not insert CP Partner profile (Make sure you ran the SQL script in Supabase first!):', cpError.message);
    } else {
      console.log('Successfully upserted CP Partner profile for Apex Luxury Realty');
    }
  } catch (err) {
    console.warn('Failed to insert CP Profile:', err.message);
  }
}

run();
