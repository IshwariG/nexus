import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const action = searchParams.get('action') || 'deactivate';

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    const targetActive = action === 'activate';

    // Soft-delete/reactivate the salesperson from the Users table by setting is_active
    const { error: userError } = await supabase
      .from('Users')
      .update({ is_active: targetActive })
      .eq('username', username)
      .eq('role', 'Sales'); // Safety check to ensure we only target Salesperson accounts

    if (userError) throw userError;

    return NextResponse.json({ success: true, message: `Salesperson ${targetActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
