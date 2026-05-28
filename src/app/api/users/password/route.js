import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(request) {
  try {
    const { username, currentPassword, newPassword } = await request.json();

    if (!username) return NextResponse.json({ success: false, error: 'username required' }, { status: 400 });
    if (!currentPassword) return NextResponse.json({ success: false, error: 'currentPassword required' }, { status: 400 });
    if (!newPassword) return NextResponse.json({ success: false, error: 'newPassword required' }, { status: 400 });
    if (String(newPassword).length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const { data: user, error: fetchErr } = await supabase
      .from('Users')
      .select('username,password')
      .eq('username', username)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ success: false, error: 'Database Error: ' + fetchErr.message }, { status: 400 });
    }
    if (!user) return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });

    // Note: passwords are currently stored in plaintext in this demo app.
    // If you later migrate to hashing, replace this comparison + update.
    if (user.password !== currentPassword) {
      return NextResponse.json({ success: false, error: 'Invalid current password.' }, { status: 401 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ success: false, error: 'New password must be different from current password.' }, { status: 400 });
    }

    const { error: updateErr } = await supabase
      .from('Users')
      .update({ password: newPassword })
      .eq('username', username);

    if (updateErr) {
      return NextResponse.json({ success: false, error: 'Database Error: ' + updateErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update password: ' + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}

