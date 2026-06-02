import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const username = cookieStore.get('user_id')?.value;

    if (!username) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from('Users')
      .select('username, role, phone, email, full_name, employee_id')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const username = cookieStore.get('user_id')?.value;

    if (!username) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone, email, employee_id } = body;

    // Check duplicate phone and email on OTHER users
    const { data: existingUsers, error: dupCheckError } = await supabase
      .from('Users')
      .select('username, phone, email')
      .neq('username', username);

    if (dupCheckError) throw dupCheckError;

    if (phone) {
      const trimmedPhone = phone.trim();
      if (trimmedPhone) {
        const dup = existingUsers.find(u => u.phone === trimmedPhone);
        if (dup) {
          return NextResponse.json({ success: false, error: `Phone number "${trimmedPhone}" is already registered by another account (${dup.username}).` }, { status: 400 });
        }
      }
    }

    if (email) {
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedEmail) {
        const dup = existingUsers.find(u => u.email && u.email.toLowerCase() === trimmedEmail);
        if (dup) {
          return NextResponse.json({ success: false, error: `Email address "${email}" is already registered by another account (${dup.username}).` }, { status: 400 });
        }
      }
    }

    // Build update object
    const updateObj = {};
    if (full_name !== undefined) updateObj.full_name = full_name;
    if (phone !== undefined) updateObj.phone = phone ? phone.trim() : null;
    if (email !== undefined) updateObj.email = email ? email.trim() : null;
    if (employee_id !== undefined) updateObj.employee_id = employee_id;

    const { error: updateError } = await supabase
      .from('Users')
      .update(updateObj)
      .eq('username', username);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Profile updated successfully!' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
