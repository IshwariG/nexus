import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (!rawUrl || rawUrl === 'paste_your_project_url_here' || !rawUrl.startsWith('http')) {
      return NextResponse.json({ success: false, error: 'Database not connected! Please make sure your Supabase URL in .env.local starts with https:// and restart the server.' }, { status: 401 });
    }

    const { username, password } = await request.json();
    
    // In a real app, use Supabase Auth or proper password hashing.
    // This is for demonstration purposes.
    const { data: user, error } = await supabase
      .from('Users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) {
       return NextResponse.json({ success: false, error: 'Database Error: ' + error.message }, { status: 400 });
    }

    if (!user) {
       return NextResponse.json({ success: false, error: 'User ID not found in database.' }, { status: 401 });
    }

    if (user.password === password) {
      const cookieStore = await cookies();
      cookieStore.set('user_role', user.role, { path: '/' });
      cookieStore.set('user_id', user.username, { path: '/' });
      return NextResponse.json({ success: true, role: user.role });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to authenticate: ' + (error.message || String(error)) }, { status: 500 });
  }
}
