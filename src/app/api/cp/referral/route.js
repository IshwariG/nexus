import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { cp_username, client_name, email, phone, pref_type, message } = body;

    if (!cp_username || !client_name || !phone) {
      return NextResponse.json({ success: false, error: 'CP Username, Client Name, and Phone are required' }, { status: 400 });
    }

    // 1. Assign to a Sales Executive using round-robin logic
    const salesmen = ['SR-9999', 'SR-1111', 'SR-2222', 'SR-3333', 'SR-4444'];
    let nextSalesman = salesmen[0];

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
