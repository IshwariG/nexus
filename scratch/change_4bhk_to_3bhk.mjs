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

async function runUpdate() {
  console.log('Updating all 4BHK PENTHOUSE units to 3BHK PENTHOUSE in the database...');
  const { data, error } = await supabase
    .from('PropertyUnits')
    .update({ type: '3BHK PENTHOUSE' })
    .eq('type', '4BHK PENTHOUSE');

  if (error) {
    console.error('Update failed:', error);
  } else {
    console.log('✅ Update completed successfully! All 4BHK units changed to 3BHK.');
  }
}

runUpdate();
