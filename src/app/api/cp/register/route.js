import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, firm_name, rera_number, commission_rate } = body;

    if (!username || !password || !firm_name || !rera_number) {
      return NextResponse.json({ success: false, error: 'All fields (Username, Password, Firm Name, RERA) are required' }, { status: 400 });
    }

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('Users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ success: false, error: `Username "${username}" is already taken.` }, { status: 400 });
    }

    // 2. Create User account
    const { error: userError } = await supabase
      .from('Users')
      .insert([
        { username, password, role: 'ChannelPartner' }
      ]);

    if (userError) {
      return NextResponse.json({ success: false, error: 'User registration failed: ' + userError.message }, { status: 400 });
    }

    // 3. Create CP Partner profile
    const { error: profileError } = await supabase
      .from('CP_Partners')
      .insert([
        {
          username,
          firm_name,
          rera_number,
          commission_rate: parseFloat(commission_rate) || 2.0
        }
      ]);

    if (profileError) {
      // Rollback user creation on profile failure
      await supabase.from('Users').delete().eq('username', username);
      return NextResponse.json({ success: false, error: 'CP Profile creation failed: ' + profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
