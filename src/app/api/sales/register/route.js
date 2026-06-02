import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, phone, password, full_name, employee_id, email } = body;

    if (!username || !phone || !password || !full_name || !email) {
      return NextResponse.json({ success: false, error: 'Username, Phone, Email, Password, and Full Name are required.' }, { status: 400 });
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
        { username, phone: phone.trim(), email: email.trim(), password, role: 'Sales', full_name, employee_id: employee_id || 'SALES REPRESENTATIVE' }
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
