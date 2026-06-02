import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const inquiryId = searchParams.get('inquiry_id');
    const salesmanId = searchParams.get('salesman_id');

    // Exotel POSTs status callbacks as application/x-www-form-urlencoded
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);

    const callSid = params.get('CallSid');
    const durationStr = params.get('Duration');
    const status = params.get('Status');
    const recordingUrl = params.get('RecordingUrl');

    const duration = parseInt(durationStr) || 0;

    // Build description notes
    const notes = `Outgoing Exotel Call. Status: ${status || 'COMPLETED'}. Duration: ${Math.floor(duration / 60)}m ${duration % 60}s.`;

    // Insert into CallLogs Supabase table
    const { data, error } = await supabase
      .from('CallLogs')
      .insert([
        {
          inquiry_id: inquiryId || null,
          salesman_id: salesmanId || 'SR-9999',
          duration: duration,
          notes: notes,
          recording_url: recordingUrl || `/recordings/simulated_exotel_${Date.now()}.mp3`
        }
      ])
      .select();

    if (error) {
      console.error('Database insertion error in Exotel status callback webhook:', error);
      throw error;
    }

    return NextResponse.json({ success: true, data: data[0] });

  } catch (err) {
    console.error('Exotel webhook server error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
