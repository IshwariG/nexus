import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    const salesmen = ['SR-9999', 'SR-1111', 'SR-2222', 'SR-3333', 'SR-4444'];
    let nextSalesman = salesmen[0];

    if (data.salesman_id) {
      nextSalesman = data.salesman_id;
    } else {
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

    // Detect if this is a site walk-in qualification event (DONE status)
    let isWalkIn = false;
    let cpUsername = null;
    if (status && status.startsWith('DONE|')) {
      isWalkIn = true;
      const { data: currentInq } = await supabase
        .from('Inquiries')
        .select('source')
        .eq('id', id)
        .maybeSingle();
      if (currentInq && currentInq.source && currentInq.source.startsWith('CP_Referral|')) {
        cpUsername = currentInq.source.split('|')[1];
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
