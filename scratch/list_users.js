const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim();
      }
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
        supabaseAnonKey = line.split('=')[1].trim();
      }
    }
  }
} catch (e) {
  console.error("Error reading env file:", e);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Could not parse Supabase config from .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('Users').select('*');
  if (error) {
    console.error("Error fetching users:", error);
  } else {
    console.log("Users:", JSON.stringify(data, null, 2));
  }
}

run();
