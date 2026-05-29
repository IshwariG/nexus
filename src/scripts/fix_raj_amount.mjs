// Auto-fix raj's commission:
// Since raj has no buyer record, use 3BHK Penthouse price (1.0-1.5 Cr budget from message)
// Find a 3BHK unit from PropertyUnits and calculate commission based on that
import { supabase } from '../lib/supabase.js';

// 1. Find available/sold 3BHK type units to get a price reference
const { data: units } = await supabase.from('PropertyUnits').select('unit_id, type, price, status');
console.log('All units:');
console.table(units);

// 2. Get commission record for raj
const { data: comm } = await supabase.from('Commissions').select('*').eq('client_name', 'raj').maybeSingle();
console.log('\nRaj commission:', comm);

// 3. Find a 3BHK unit price to use as reference
const threeRHK = units?.find(u => u.type?.toLowerCase().includes('3') || u.type?.toLowerCase().includes('bhk'));
const anyUnit = units?.[0];
const refUnit = threeRHK || anyUnit;

if (!refUnit) {
  console.log('No units found. Cannot fix.');
  process.exit(1);
}

console.log('\nUsing reference unit:', refUnit);

// Parse price
const priceStr = refUnit.price || '';
const cleaned = priceStr.replace(/[^\d.]/g, '');
let priceLakhs = parseFloat(cleaned) || 0;
if (priceStr.toLowerCase().includes('cr')) priceLakhs = priceLakhs * 100;

const commissionRate = 2.5; // ig real estate rate
const commLakhs = (priceLakhs * commissionRate) / 100;
const formattedAmount = `₹ ${commLakhs.toFixed(2)} L`;

console.log(`\nCalculated commission: ${formattedAmount} (${commissionRate}% of ${priceStr} = ${priceLakhs} L)`);

// 4. Update the commission record
if (comm) {
  const { error } = await supabase
    .from('Commissions')
    .update({ amount: formattedAmount, unit_id: refUnit.unit_id })
    .eq('id', comm.id);

  if (error) {
    console.log('❌ Failed to update:', error.message);
  } else {
    console.log(`✅ Updated raj commission: Unit ${refUnit.unit_id}, Amount ${formattedAmount}`);
  }
}
