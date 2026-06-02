import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const inquiryId = searchParams.get('inquiry_id');
    const salesmanId = searchParams.get('salesman_id');

    let query = supabase.from('CallLogs').select('*').order('created_at', { ascending: false });
    
    if (inquiryId) {
      query = query.eq('inquiry_id', inquiryId);
    }
    if (salesmanId) {
      query = query.eq('salesman_id', salesmanId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { inquiry_id, salesman_id, duration, notes, recording_url } = body;

    if (!salesman_id) {
      return NextResponse.json({ success: false, error: 'Salesman ID is required' }, { status: 400 });
    }

    // Insert call log into CallLogs table
    const { data, error } = await supabase
      .from('CallLogs')
      .insert([
        {
          inquiry_id: inquiry_id || null,
          salesman_id,
          duration: parseInt(duration) || 0,
          notes: notes || '',
          recording_url: recording_url || `/recordings/simulated_${Date.now()}.mp3`
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
