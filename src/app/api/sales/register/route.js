import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, phone, password, full_name, employee_id } = body;

    if (!username || !phone || !password || !full_name) {
      return NextResponse.json({ success: false, error: 'Username, Phone, Password, and Full Name are required.' }, { status: 400 });
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
        { username, phone: phone.trim(), password, role: 'Sales', full_name, employee_id: employee_id || 'SALES REPRESENTATIVE' }
      ]);

    if (userError) {
      return NextResponse.json({ success: false, error: 'User registration failed: ' + userError.message }, { status: 400 });
    }

    // 3. (Optional) Create Salesperson profile if you have a separate table for it, like CP_Partners.
    // For now, inserting into Users with role='Sales' is sufficient for authentication.
    // If you have a Salespersons table, insert here.

    return NextResponse.json({ success: true, message: 'Salesperson registered successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to process request: ' + error.message }, { status: 500 });
  }
}
