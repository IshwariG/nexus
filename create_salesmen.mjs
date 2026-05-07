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

async function setup() {
  const salesmen = [
    { role: 'Sales', username: 'SR-1111', password: 'password123' },
    { role: 'Sales', username: 'SR-2222', password: 'password123' },
    { role: 'Sales', username: 'SR-3333', password: 'password123' },
    { role: 'Sales', username: 'SR-4444', password: 'password123' }
  ];

  for (const s of salesmen) {
    const { data, error } = await supabase.from('Users').insert([s]);
    if (error) {
      console.log('Error adding', s.username, error.message);
    } else {
      console.log('Added', s.username);
    }
  }
}

setup();
