import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    // Delete the salesperson from the Users table
    const { error: userError } = await supabase
      .from('Users')
      .delete()
      .eq('username', username)
      .eq('role', 'Sales'); // Safety check to ensure we only delete Salesperson accounts

    if (userError) throw userError;

    return NextResponse.json({ success: true, message: 'Salesperson deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
