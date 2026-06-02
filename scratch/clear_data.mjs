import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ucqdbshwpbcxahswpfzl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjcWRic2h3cGJjeGFoc3dwZnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NjU3NTIsImV4cCI6MjA5MzM0MTc1Mn0.ljyut3_gMNzRVaVLjfKmmP_Atijay_c1wMGyz8r0j54';
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearData() {
  console.log('Starting cleanup of database tables...');

  // 1. Clear Inquiries & Related Tables
  const clearInquiriesSql = `
    DELETE FROM "CallLogs";
    DELETE FROM "Opportunities";
    DELETE FROM "Inquiries";
  `;
  
  const { error: inqError } = await supabase.rpc('exec_sql', { sql_query: clearInquiriesSql });
  if (inqError) {
    console.error('Error clearing Inquiries, CallLogs, or Opportunities:', inqError);
  } else {
    console.log('✅ Inquiries, CallLogs, and Opportunities cleared successfully.');
  }

  // 2. Clear Buyer Portal Details & Reset Unit Inventory
  const clearBuyersSql = `
    DELETE FROM "BuyerDetails";
    DELETE FROM "Users" WHERE role = 'buyer';
    UPDATE "PropertyUnits" SET status = 'AVAILABLE', tag_color = NULL;
  `;

  const { error: buyerError } = await supabase.rpc('exec_sql', { sql_query: clearBuyersSql });
  if (buyerError) {
    console.error('Error clearing Buyers and resetting inventory:', buyerError);
  } else {
    console.log('✅ Buyer accounts deleted and all unit inventory reset to AVAILABLE.');
  }

  // 3. Clear Channel Partner Accounts & Commissions
  const clearCpSql = `
    DELETE FROM "Commissions";
    DELETE FROM "CP_Partners";
    DELETE FROM "Users" WHERE role = 'cp';
  `;

  const { error: cpError } = await supabase.rpc('exec_sql', { sql_query: clearCpSql });
  if (cpError) {
    console.error('Error clearing Channel Partners and Commissions:', cpError);
  } else {
    console.log('✅ Channel Partner records and commissions cleared successfully.');
  }

  console.log('Cleanup completed!');
}

clearData();
