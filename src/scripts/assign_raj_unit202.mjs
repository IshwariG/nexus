// Assign raj to unit 202 — update commission + mark unit as SOLD OUT
import { supabase } from '../lib/supabase.js';

const unitId = '202';
const cpCommissionRate = 2.5;

// 1. Get unit 202 price
const { data: unit } = await supabase.from('PropertyUnits').select('unit_id, type, price, status').eq('unit_id', unitId).maybeSingle();
console.log('Unit 202:', unit);

if (!unit) { console.log('Unit 202 not found!'); process.exit(1); }

// 2. Calculate commission
const priceStr = unit.price || '';
const cleaned = priceStr.replace(/[^\d.]/g, '');
let priceLakhs = parseFloat(cleaned) || 0;
if (priceStr.toLowerCase().includes('cr')) priceLakhs = priceLakhs * 100;
const commLakhs = (priceLakhs * cpCommissionRate) / 100;
const formattedAmount = `₹ ${commLakhs.toFixed(2)} L`;
console.log(`Commission: ${cpCommissionRate}% of ${priceStr} = ${formattedAmount}`);

// 3. Update commission record for raj
const { data: comm, error: commErr } = await supabase
  .from('Commissions')
  .update({ unit_id: unitId, amount: formattedAmount })
  .eq('client_name', 'raj')
  .select();

if (commErr) { console.log('❌ Commission update failed:', commErr.message); }
else { console.log('✅ Commission updated:', comm); }

// 4. Mark unit 202 as SOLD OUT
const { error: unitErr } = await supabase
  .from('PropertyUnits')
  .update({ status: 'SOLD OUT' })
  .eq('unit_id', unitId);

if (unitErr) { console.log('❌ Unit update failed:', unitErr.message); }
else { console.log('✅ Unit 202 marked as SOLD OUT'); }

console.log(`\nDone! raj → Unit V-202 | Commission: ${formattedAmount}`);
