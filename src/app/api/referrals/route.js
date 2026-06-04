import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const getLocalDbPath = () => {
  return path.join(process.cwd(), 'referrals_db.json');
};

const readLocalDb = () => {
  try {
    const dbPath = getLocalDbPath();
    if (!fs.existsSync(dbPath)) {
      // Create with initial seed data
      const initial = [
        {
          id: "77e78eeb-8c2d-43ee-bd16-77f968d1b234",
          referrer_username: "ram",
          friend_name: "Vikram Aditya",
          friend_phone: "9822334455",
          status: "WALKED_IN",
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data) || [];
  } catch (e) {
    console.error('Error reading local referrals DB:', e);
    return [];
  }
};

const writeLocalDb = (data) => {
  try {
    const dbPath = getLocalDbPath();
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local referrals DB:', e);
  }
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const referrerUsername = searchParams.get('referrer');

    // 1. Try to fetch from Supabase
    try {
      let query = supabase.from('Referrals').select('*').order('created_at', { ascending: false });
      if (referrerUsername) {
        query = query.eq('referrer_username', referrerUsername);
      }
      const { data, error } = await query;
      if (!error) {
        return NextResponse.json({ success: true, data });
      }
      console.warn('Supabase Referrals fetch failed, falling back to local file DB:', error.message);
    } catch (e) {
      console.warn('Supabase Referrals query error, falling back to local file DB');
    }

    // 2. Fallback to Local JSON DB
    let referrals = readLocalDb();
    if (referrerUsername) {
      referrals = referrals.filter(r => r.referrer_username === referrerUsername);
    }
    referrals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return NextResponse.json({ success: true, data: referrals });
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

    let savedRecord = null;
    let fallbackUsed = false;

    // 1. Try to save to Supabase Referrals
    try {
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
      if (!error && data && data.length > 0) {
        savedRecord = data[0];
      } else {
        console.warn('Supabase Referrals insert failed, falling back to local file DB:', error ? error.message : 'No data');
        fallbackUsed = true;
      }
    } catch (e) {
      console.warn('Supabase Referrals insert error, falling back to local file DB');
      fallbackUsed = true;
    }

    // 2. Local File DB Fallback
    if (fallbackUsed || !savedRecord) {
      const referrals = readLocalDb();
      savedRecord = {
        id: randomUUID(),
        referrer_username,
        friend_name,
        friend_phone,
        status: 'REFERRED',
        created_at: new Date().toISOString()
      };
      referrals.push(savedRecord);
      writeLocalDb(referrals);
    }

    // 3. Create a corresponding Inquiry/Lead so the Salesperson CRM can view/track it
    let targetSalesman = 'unassigned';
    try {
      const { data: dbSales } = await supabase
        .from('Users')
        .select('username')
        .eq('role', 'Sales')
        .neq('is_active', false);
      
      if (dbSales && dbSales.length > 0) {
        const salesmen = dbSales.map(u => u.username);
        targetSalesman = salesmen[0];
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
              targetSalesman = salesmen[(lastIndex + 1) % salesmen.length];
            }
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch salespersons for referral inquiry status:', err.message);
    }

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
            status: `NEW|${targetSalesman}`
          }
        ]);
    } catch (e) {
      console.warn('Failed to insert referral as a CRM Inquiry:', e.message);
    }

    return NextResponse.json({ success: true, data: savedRecord });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
