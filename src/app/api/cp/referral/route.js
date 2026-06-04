import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { cp_username, client_name, email, phone, aadhaar, pref_type, message } = body;

    if (!cp_username || !client_name || !phone) {
      return NextResponse.json({ success: false, error: 'CP Username, Client Name, and Phone are required' }, { status: 400 });
    }

    // --- Duplicate Lead Check ---
    const phoneVal = phone.trim();
    const emailVal = email ? email.trim() : '';
    const aadhaarVal = aadhaar ? aadhaar.trim() : '';

    if (phoneVal || emailVal || aadhaarVal) {
      let query = supabase.from('Inquiries').select('id, name, source, created_at, phone, email, aadhaar');
      const orConditions = [];
      if (phoneVal) orConditions.push(`phone.eq.${phoneVal}`);
      if (emailVal) orConditions.push(`email.eq.${emailVal}`);
      if (aadhaarVal) orConditions.push(`aadhaar.eq.${aadhaarVal}`);

      if (orConditions.length > 0) {
        query = query.or(orConditions.join(','));
        const { data: existingLeads, error: checkError } = await query.order('created_at', { ascending: true });
        if (checkError) throw checkError;

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
            success: false,
            error: `Duplicate registration: This client is already registered in the system with the same ${duplicateField || 'details'}. First registered on ${new Date(first.created_at).toLocaleDateString()} via ${sourceStr || 'Direct Sales'}.`
          }, { status: 409 });
        }
      }
    }

    // 1. Assign to a Sales Executive using round-robin logic
    let nextSalesman = 'unassigned';
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
      console.warn('Failed to fetch salespersons from DB:', e.message);
    }

    if (salesmen.length > 0) {
      nextSalesman = salesmen[0];
      try {
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
      } catch (e) {
        console.warn('Failed to query last inquiry for round-robin assignment:', e.message);
      }
    }

    const finalStatus = `NEW|${nextSalesman}`;
    const composedMessage = `[Referred Lead] Preference: ${pref_type || 'Any BHK'}. Message: ${message || 'No remarks provided.'}`;

    // 2. Insert the lead into the Inquiries table
    const { data, error } = await supabase
      .from('Inquiries')
      .insert([
        {
          name: client_name,
          email: email || '',
          phone: phone,
          aadhaar: aadhaarVal || null,
          message: composedMessage,
          source: `CP_Referral|${cp_username}`,
          status: finalStatus
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, lead: data[0] });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
