import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, phone, password, firm_name, rera_number, commission_rate, email } = body;

    if (!username || !phone || !password || !firm_name || !rera_number || !email) {
      return NextResponse.json({ success: false, error: 'All fields (Username, Phone, Email, Password, Firm Name, RERA) are required' }, { status: 400 });
    }

    // 1. Check if user already exists or has duplicate phone/email
    const { data: existingUsers, error: dupCheckError } = await supabase
      .from('Users')
      .select('username, phone, email');

    if (dupCheckError) {
      return NextResponse.json({ success: false, error: 'Database error: ' + dupCheckError.message }, { status: 400 });
    }

    if (existingUsers.some(u => u.username === username)) {
      return NextResponse.json({ success: false, error: `Username "${username}" is already taken.` }, { status: 400 });
    }

    if (phone) {
      const trimmedPhone = phone.trim();
      const dup = existingUsers.find(u => u.phone === trimmedPhone);
      if (dup) {
        return NextResponse.json({ success: false, error: `Phone number "${trimmedPhone}" is already registered.` }, { status: 400 });
      }
    }

    if (email) {
      const trimmedEmail = email.trim().toLowerCase();
      const dup = existingUsers.find(u => u.email && u.email.toLowerCase() === trimmedEmail);
      if (dup) {
        return NextResponse.json({ success: false, error: `Email address "${email}" is already registered.` }, { status: 400 });
      }
    }

    // 2. Create User account
    const { error: userError } = await supabase
      .from('Users')
      .insert([
        { username, phone: phone.trim(), email: email.trim(), password, role: 'ChannelPartner' }
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
