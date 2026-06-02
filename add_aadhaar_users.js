const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log('--- Checking if column aadhaar exists in Users table ---');
    
    // We can run an RPC or just execute raw sql using prisma or directly if we have endpoints, 
    // or try querying it. Alternatively we can try doing a mock update to see if it fails.
    // However, since we don't have raw SQL execution directly in JS Supabase client without RPC,
    // let's try an update to test.
    const { error } = await supabase.from('Users').select('aadhaar').limit(1);
    if (error && error.message.includes('column "aadhaar" does not exist')) {
      console.log('Column "aadhaar" does not exist. We need to add it using Supabase dashboard or sql query.');
      // Wait, let's check if we can add it using Prisma if Prisma is configured!
      // Is Prisma configured? Let's check.
    } else if (error) {
      console.error('Error querying Users:', error.message);
    } else {
      console.log('Column "aadhaar" already exists in Users table!');
    }
  } catch (err) {
    console.error(err);
  }
}

run();
