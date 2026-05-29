// Backfill: Create commissions for CP leads that are already CONVERTED but have no commission
// Run with: node --env-file=.env.local src/scripts/backfill_commissions.mjs

import { supabase } from '../lib/supabase.js';

// Note: "krishna" with phone 9876543456 — their CP source is CP_Referral|cp102
// but the CONVERTED inquiry (P.R.POTE) is a different person with same phone — so we skip that.
// Only process where the CP_Referral inquiry itself is CONVERTED.

const { data: cpLeads } = await supabase
  .from('Inquiries')
  .select('id, name, phone, source, status')
  .like('source', 'CP_Referral|%')
  .like('status', 'CONVERTED%');

if (!cpLeads || cpLeads.length === 0) {
  console.log('No CONVERTED CP referral inquiries found. Nothing to backfill.');
  process.exit(0);
}

console.log(`Found ${cpLeads.length} CONVERTED CP referral inquiries to backfill:\n`);
console.table(cpLeads);

for (const lead of cpLeads) {
  const cpUsername = lead.source.split('|')[1];
  const salesmanId = lead.status.split('|')[1];
  const unitId = null; // We'll look it up from BuyerDetails by phone

  // Find buyer unit from BuyerDetails (by matching phone... or we use a heuristic)
  // Since BuyerDetails doesn't store phone directly, find via UNIT_ASSIGNMENT_ inquiries
  const { data: unitAssign } = await supabase
    .from('Inquiries')
    .select('source')
    .eq('phone', lead.phone)
    .like('source', 'UNIT_ASSIGNMENT_%')
    .order('created_at', { ascending: false })
    .limit(1);

  let resolvedUnitId = null;
  if (unitAssign && unitAssign.length > 0) {
    resolvedUnitId = unitAssign[0].source.replace('UNIT_ASSIGNMENT_', '');
  }

  // Get CP profile
  const { data: cpProfile } = await supabase
    .from('CP_Partners')
    .select('id, commission_rate')
    .eq('username', cpUsername)
    .maybeSingle();

  if (!cpProfile) {
    console.log(`⚠️  CP username "${cpUsername}" not found in CP_Partners. Skipping ${lead.name}.`);
    continue;
  }

  let commAmount = '₹ 0.00 L';
  if (resolvedUnitId) {
    const { data: unitData } = await supabase
      .from('PropertyUnits')
      .select('price')
      .eq('unit_id', resolvedUnitId)
      .maybeSingle();

    if (unitData?.price) {
      const priceStr = unitData.price;
      const cleaned = priceStr.replace(/[^\d.]/g, '');
      let priceLakhs = parseFloat(cleaned) || 0;
      if (priceStr.toLowerCase().includes('cr')) priceLakhs = priceLakhs * 100;
      const rate = parseFloat(cpProfile.commission_rate) || 2.0;
      const commLakhs = (priceLakhs * rate) / 100;
      commAmount = `₹ ${commLakhs.toFixed(2)} L`;
    }
  }

  // Check if commission already exists for this lead
  const { data: existing } = await supabase
    .from('Commissions')
    .select('id')
    .eq('cp_id', cpProfile.id)
    .eq('client_name', lead.name);

  if (existing && existing.length > 0) {
    console.log(`✅ Commission already exists for ${lead.name}. Skipping.`);
    continue;
  }

  const { error } = await supabase.from('Commissions').insert([{
    cp_id: cpProfile.id,
    client_name: lead.name,
    unit_id: resolvedUnitId || 'N/A',
    amount: commAmount,
    status: 'APPROVED'
  }]);

  if (error) {
    console.log(`❌ Failed to insert commission for ${lead.name}: ${error.message}`);
  } else {
    console.log(`✅ Commission created for ${lead.name} | CP: ${cpUsername} | Unit: ${resolvedUnitId || 'N/A'} | Amount: ${commAmount}`);
  }
}

console.log('\nBackfill complete. Reload admin dashboard to see commissions.');
