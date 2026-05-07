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

async function updatePasswords() {
  const passwords = {
    'SR-9999': 'Vikram@123',
    'SR-1111': 'Ananya@123',
    'SR-2222': 'Karan@123',
    'SR-3333': 'Priya@123',
    'SR-4444': 'Rohan@123'
  };

  for (const [username, password] of Object.entries(passwords)) {
    const { data, error } = await supabase
      .from('Users')
      .update({ password })
      .eq('username', username);
      
    if (error) {
      console.log('Error updating', username, error.message);
    } else {
      console.log('Updated password for', username);
    }
  }
}

updatePasswords();
