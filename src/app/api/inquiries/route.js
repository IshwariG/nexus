import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('Inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // --- Duplicate Detection ---
    const isUnitAssignment = data.source && data.source.startsWith('UNIT_ASSIGNMENT_');
    const emailVal = data.email ? data.email.trim() : '';
    const phoneVal = data.phone ? data.phone.trim() : '';
    const aadhaarVal = data.aadhaar ? data.aadhaar.trim() : '';

    if (!isUnitAssignment && (emailVal || phoneVal || aadhaarVal)) {
      let query = supabase.from('Inquiries').select('id, name, source, created_at, email, phone, aadhaar');
      const orConditions = [];
      if (emailVal) orConditions.push(`email.eq.${emailVal}`);
      if (phoneVal) orConditions.push(`phone.eq.${phoneVal}`);
      if (aadhaarVal) orConditions.push(`aadhaar.eq.${aadhaarVal}`);

      if (orConditions.length > 0) {
        query = query.or(orConditions.join(','));
        const { data: existingLeads } = await query.order('created_at', { ascending: true });
        
        if (existingLeads && existingLeads.length > 0) {
          const first = existingLeads[0];
          const rawSource = first.source || '';
          const sourceStr = rawSource.startsWith('CP_Referral|') 
            ? `Channel Partner (${rawSource.split('|')[1]})` 
            : rawSource;
          
          let duplicateField = '';
          if (phoneVal && first.phone === phoneVal) {
            duplicateField = 'Phone Number';
          } else if (aadhaarVal && first.aadhaar === aadhaarVal) {
            duplicateField = 'Aadhaar Card';
          } else if (emailVal && first.email === emailVal) {
            duplicateField = 'Email Address';
          }

          return NextResponse.json({
            error: 'Duplicate registration detected',
            warning: `This lead is already registered in the system with the same ${duplicateField || 'details'}. First captured on ${new Date(first.created_at).toLocaleDateString()} via ${sourceStr || 'Direct Sales'}.`
          }, { status: 409 });
        }
      }
    }

    // Round-robin assignment if not explicitly assigned
    let nextSalesman = 'unassigned';

    if (data.salesman_id) {
      nextSalesman = data.salesman_id;
    } else {
      let salesmen = [];
      try {
        const { data: dbSales } = await supabase
          .from('Users')
          .select('username')
          .eq('role', 'Sales')
          .neq('is_active', false);
        
        if (dbSales && dbSales.length > 0) {
          salesmen = dbSales.map(u => u.username);
        }
      } catch (e) {
        console.error("Failed to fetch salesmen from DB:", e.message);
      }

      if (salesmen.length > 0) {
        nextSalesman = salesmen[0];
        const { data: lastInquiry } = await supabase
          .from('Inquiries')
          .select('status')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (lastInquiry && lastInquiry.length > 0) {
          const lastStatus = lastInquiry[0].status || '';
          const parts = lastStatus.split('|');
          if (parts.length > 1) {
            const lastSalesman = parts[1];
            const lastIndex = salesmen.indexOf(lastSalesman);
            if (lastIndex !== -1) {
              nextSalesman = salesmen[(lastIndex + 1) % salesmen.length];
            }
          }
        }
      }
    }

    // Use provided status or default to NEW|salesman
    const finalStatus = data.status || `NEW|${nextSalesman}`;

    const { data: newInquiry, error } = await supabase
      .from('Inquiries')
      .insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
          aadhaar: data.aadhaar || null,
          message: data.message || '',
          source: data.source || 'Website',
          status: finalStatus
        }
      ])
      .select();

    if (error) throw error;

    // --- Automatic Commission Allocation for Channel Partners ---
    if (data.source && data.source.startsWith('UNIT_ASSIGNMENT_')) {
      const unitId = data.source.replace('UNIT_ASSIGNMENT_', '');
      
      // 1. Check if there was a lead referred by a CP that matches this phone number
      const { data: cpLeads } = await supabase
        .from('Inquiries')
        .select('source, phone')
        .like('source', 'CP_Referral|%')
        .order('created_at', { ascending: false });

      const normalizePhone = (p) => {
        if (!p) return '';
        return p.replace(/[^\d]/g, '').slice(-10);
      };

      const targetPhoneNormalized = normalizePhone(data.phone);
      const matchingCpLead = cpLeads ? cpLeads.find(lead => normalizePhone(lead.phone) === targetPhoneNormalized) : null;

      if (matchingCpLead) {
        // Find the CP username from source (e.g. CP_Referral|cp101)
        const cpUsername = matchingCpLead.source.split('|')[1];
        
        // 2. Fetch the CP's profile for commission rate
        const { data: cpProfile } = await supabase
          .from('CP_Partners')
          .select('id, commission_rate')
          .eq('username', cpUsername)
          .maybeSingle();

        if (cpProfile) {
          // 3. Fetch the unit price
          const { data: unitData } = await supabase
            .from('PropertyUnits')
            .select('price')
            .eq('unit_id', unitId)
            .maybeSingle();

          if (unitData && unitData.price) {
            // 4. Calculate commission based on rate
            const parsePriceToLakhs = (priceStr) => {
              if (!priceStr) return 0;
              const cleaned = priceStr.replace(/[^\d.]/g, '');
              const val = parseFloat(cleaned);
              if (isNaN(val)) return 0;
              if (priceStr.toLowerCase().includes('cr')) {
                return val * 100; // 1 Cr = 100 Lakhs
              }
              return val;
            };

            const priceLakhs = parsePriceToLakhs(unitData.price);
            const rate = parseFloat(cpProfile.commission_rate) || 2.0;
            const commLakhs = (priceLakhs * rate) / 100;
            const formattedCommission = `₹ ${commLakhs.toFixed(2)} L`;

            // 5. Insert Commission Record as APPROVED
            await supabase
              .from('Commissions')
              .insert([
                {
                  cp_id: cpProfile.id,
                  client_name: data.name,
                  unit_id: unitId,
                  amount: formattedCommission,
                  status: 'APPROVED'
                }
              ]);
          }
        }
      }
    }

    return NextResponse.json(newInquiry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to submit inquiry' }, { status: 500 });
  }
}

// Helper to normalize phone numbers for referral matching
const normalizePhoneForSync = (p) => {
  if (!p) return '';
  return p.replace(/[^\d]/g, '').slice(-10);
};

// Sync Referral Status between Inquiry progression and Referral list
async function syncReferralStatus(phone, newStatus) {
  if (!phone) return;
  const targetPhoneNormalized = normalizePhoneForSync(phone);
  
  let referralStatus = null;
  if (newStatus.startsWith('DONE|')) {
    referralStatus = 'WALKED_IN';
  } else if (newStatus.startsWith('CONVERTED|')) {
    referralStatus = 'BOOKED';
  }
  
  if (!referralStatus) return;

  // 1. Try updating in Supabase
  try {
    const { data: allReferrals, error: fetchErr } = await supabase
      .from('Referrals')
      .select('*');
    
    if (!fetchErr && allReferrals) {
      const match = allReferrals.find(r => normalizePhoneForSync(r.friend_phone) === targetPhoneNormalized);
      if (match) {
        await supabase
          .from('Referrals')
          .update({ status: referralStatus })
          .eq('id', match.id);
        console.log(`Updated referral ID ${match.id} to ${referralStatus} in Supabase`);
      }
    }
  } catch (e) {
    console.warn('Supabase referral sync failed, falling back to local file DB:', e.message);
  }

  // 2. Sync to local referrals_db.json fallback
  try {
    const dbPath = path.join(process.cwd(), 'referrals_db.json');
    if (fs.existsSync(dbPath)) {
      const fileData = fs.readFileSync(dbPath, 'utf8');
      const referrals = JSON.parse(fileData) || [];
      let updated = false;
      for (const r of referrals) {
        if (normalizePhoneForSync(r.friend_phone) === targetPhoneNormalized) {
          r.status = referralStatus;
          updated = true;
        }
      }
      if (updated) {
        fs.writeFileSync(dbPath, JSON.stringify(referrals, null, 2), 'utf8');
        console.log(`Updated matching referrals to ${referralStatus} in local referrals_db.json`);
      }
    }
  } catch (e) {
    console.error('Error updating local referrals DB:', e);
  }
}

export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const qsId = searchParams.get('id');
    const body = await request.json();
    const id = qsId || body?.id;
    let status = body?.status;

    // Backwards compatibility: allow { salesmanId } and preserve stage prefix
    if (!status && body?.salesmanId) {
      const stage = body?.stage || 'NEW';
      status = `${stage}|${body.salesmanId}`;
    }

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Fetch details of the inquiry being updated to identify referred phone and source details
    let inqPhone = null;
    let isWalkIn = false;
    let cpUsername = null;

    if (status) {
      const { data: currentInq } = await supabase
        .from('Inquiries')
        .select('phone, source')
        .eq('id', id)
        .maybeSingle();

      if (currentInq) {
        inqPhone = currentInq.phone;
        if (status.startsWith('DONE|')) {
          isWalkIn = true;
          if (currentInq.source && currentInq.source.startsWith('CP_Referral|')) {
            cpUsername = currentInq.source.split('|')[1];
          }
        }
      }
    }

    const updateObj = {};
    if (status) updateObj.status = status;
    if (body?.message !== undefined) updateObj.message = body.message;
    if (body?.aadhaar !== undefined) updateObj.aadhaar = body.aadhaar;

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Inquiries')
      .update(updateObj)
      .eq('id', id)
      .select();

    if (error) throw error;

    // If status is updated, sync the referral status to reward the buyer
    if (status && inqPhone) {
      await syncReferralStatus(inqPhone, status);
    }

    // If walk-in physical arrival occurs, promote Inquiry to Opportunities with 30-day CP tagging rules
    if (isWalkIn) {
      try {
        await supabase
          .from('Opportunities')
          .insert([
            {
              inquiry_id: id,
              walk_in_date: new Date().toISOString(),
              tag_start_date: new Date().toISOString(),
              tag_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              cp_username: cpUsername,
              status: 'QUALIFIED'
            }
          ]);
      } catch (err) {
        console.warn('Failed to insert Opportunity metadata (make sure Opportunities table exists):', err.message);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
  }
}
