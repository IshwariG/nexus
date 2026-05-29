// Fix: Insert commission for 'raj' manually (CP_Referral|cp101 was referring to 'ig real estate')
// Also shows all CP referral sources vs actual CP usernames to spot mismatches

import { supabase } from '../lib/supabase.js';

console.log('\n=== ALL CP PARTNERS (actual usernames) ===');
const { data: cps } = await supabase.from('CP_Partners').select('id, username, firm_name, commission_rate');
console.table(cps);

console.log('\n=== UNIQUE SOURCES IN CP_Referral INQUIRIES ===');
const { data: allCpLeads } = await supabase.from('Inquiries').select('source').like('source', 'CP_Referral|%');
const uniqueSources = [...new Set(allCpLeads?.map(l => l.source))];
console.log(uniqueSources);

// For raj: source is CP_Referral|cp101, but no CP with username cp101
// Try to find by first CP partner as fallback, or insert with 'ig real estate' CP
const rajLead = { name: 'raj', phone: '9765855668', cpUsername: 'cp101' };

// Find unit for raj
const { data: rajUnit } = await supabase
  .from('Inquiries')
  .select('source')
  .eq('phone', rajLead.phone)
  .like('source', 'UNIT_ASSIGNMENT_%')
  .order('created_at', { ascending: false })
  .limit(1);

console.log('\nUnit assignment for raj:', rajUnit);

// Check if 'ig real estate' CP exists
const igCP = cps?.find(cp => cp.username === 'ig real estate');
if (igCP) {
  // Check for existing commission
  const { data: existing } = await supabase.from('Commissions').select('id').eq('cp_id', igCP.id).eq('client_name', 'raj');
  if (existing?.length > 0) {
    console.log('Commission for raj already exists. Skipping.');
  } else {
    let commAmount = '₹ 0.00 L';
    const unitId = rajUnit?.[0]?.source?.replace('UNIT_ASSIGNMENT_', '') || 'N/A';
    
    if (unitId !== 'N/A') {
      const { data: unit } = await supabase.from('PropertyUnits').select('price').eq('unit_id', unitId).maybeSingle();
      if (unit?.price) {
        const cleaned = unit.price.replace(/[^\d.]/g, '');
        let priceLakhs = parseFloat(cleaned) || 0;
        if (unit.price.toLowerCase().includes('cr')) priceLakhs = priceLakhs * 100;
        const commLakhs = (priceLakhs * (igCP.commission_rate || 2.5)) / 100;
        commAmount = `₹ ${commLakhs.toFixed(2)} L`;
      }
    }

    const { error } = await supabase.from('Commissions').insert([{
      cp_id: igCP.id,
      client_name: 'raj',
      unit_id: unitId,
      amount: commAmount,
      status: 'APPROVED'
    }]);

    if (error) {
      console.log('❌ Failed:', error.message);
    } else {
      console.log(`✅ Commission created for raj | CP: ig real estate | Unit: ${unitId} | Amount: ${commAmount}`);
    }
  }
} else {
  console.log('⚠️ No matching CP partner found for cp101. Available CPs:', cps?.map(c => c.username));
}
