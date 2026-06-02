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

async function check() {
  try {
    console.log('--- Querying database functions ---');
    // Supabase has standard postgres schema. We can select from pg_proc via RPC if there is a generic pg query rpc,
    // or see if RPCs exist. Let's try calling a mock RPC or checking if some common ones exist.
    // Wait, let's check if we can add columns to Users table by checking if pg_proc contains exec SQL.
    // Since we don't have exec SQL, let's see if we can use postgres package directly?
    // Wait, is 'pg' or 'postgres' or similar package installed in node_modules?
    // Let's check node_modules or try to require them.
    try {
      const pg = require('pg');
      console.log('pg is installed!');
    } catch (e) {
      console.log('pg is NOT installed.');
    }
  } catch (err) {
    console.error(err);
  }
}

check();
