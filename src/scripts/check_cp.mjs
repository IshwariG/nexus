// Diagnostic: Check CP referral leads, buyers, and commissions
// Run with: node --env-file=.env.local src/scripts/check_cp.mjs
import { supabase } from '../lib/supabase.js';

console.log('\n=== CP PARTNERS ===');
const { data: cps } = await supabase.from('CP_Partners').select('id, username, firm_name, commission_rate');
console.table(cps);

console.log('\n=== CP REFERRAL INQUIRIES ===');
const { data: cpLeads } = await supabase.from('Inquiries').select('id, name, phone, source, status').like('source', 'CP_Referral|%');
console.table(cpLeads);

console.log('\n=== CONVERTED INQUIRIES ===');
const { data: converted } = await supabase.from('Inquiries').select('id, name, phone, source, status').like('status', 'CONVERTED%');
console.table(converted);

console.log('\n=== EXISTING COMMISSIONS ===');
const { data: comms } = await supabase.from('Commissions').select('*');
console.table(comms);

console.log('\n=== CROSS-CHECK: CP leads whose phone appears in CONVERTED inquiries ===');
if (cpLeads && converted) {
  for (const cpLead of cpLeads) {
    const match = converted.find(c => c.phone === cpLead.phone);
    if (match) {
      const hasComm = comms?.find(c => c.client_name === cpLead.name);
      console.log(`CP Lead: ${cpLead.name} | Phone: ${cpLead.phone} | CP source: ${cpLead.source} | Has Commission: ${hasComm ? 'YES ✅' : 'NO ❌ — needs backfill'}`);
    }
  }
}
if (!cpLeads?.length) console.log('No CP referral inquiries found in DB.');
if (!converted?.length) console.log('No CONVERTED inquiries found in DB.');
