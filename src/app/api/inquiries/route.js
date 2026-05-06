import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('Inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { data: newInquiry, error } = await supabase
      .from('Inquiries')
      .insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message || '',
          source: data.source || 'Website',
          status: 'NEW'
        }
      ])
      .select();

    if (error) throw error;
    return NextResponse.json(newInquiry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
