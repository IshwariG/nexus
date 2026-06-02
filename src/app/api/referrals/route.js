import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const referrerUsername = searchParams.get('referrer');

    let query = supabase.from('Referrals').select('*').order('created_at', { ascending: false });

    if (referrerUsername) {
      query = query.eq('referrer_username', referrerUsername);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { referrer_username, friend_name, friend_phone } = body;

    if (!referrer_username || !friend_name || !friend_phone) {
      return NextResponse.json({ success: false, error: 'Referrer username, Friend Name, and Friend Phone are required' }, { status: 400 });
    }

    // Insert referral record
    const { data, error } = await supabase
      .from('Referrals')
      .insert([
        {
          referrer_username,
          friend_name,
          friend_phone,
          status: 'REFERRED'
        }
      ])
      .select();

    if (error) throw error;

    // Create a corresponding Inquiry/Lead so the Salesperson CRM can view/track it
    try {
      await supabase
        .from('Inquiries')
        .insert([
          {
            name: friend_name,
            phone: friend_phone,
            email: '',
            message: `[Buyer Referral] Referred by Resident Owner: ${referrer_username}. Interested in Skyview layouts.`,
            source: `Referral|${referrer_username}`,
            status: 'NEW|SR-9999' // Round-robin or default sales assignment
          }
        ]);
    } catch (e) {
      console.warn('Failed to insert referral as a CRM Inquiry:', e.message);
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
