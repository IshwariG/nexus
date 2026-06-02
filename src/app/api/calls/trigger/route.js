import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      inquiry_id, 
      salesman_id, 
      salesman_phone, 
      client_phone,
      exotel_sid,
      exotel_api_key,
      exotel_token,
      exotel_virtual_number 
    } = body;

    let finalClientPhone = client_phone;
    if (inquiry_id && (!finalClientPhone || finalClientPhone.includes('*') || finalClientPhone.trim().length !== 10)) {
      try {
        const { data: inqRecord, error: dbError } = await supabase
          .from('Inquiries')
          .select('phone')
          .eq('id', inquiry_id)
          .maybeSingle();
        
        if (dbError) throw dbError;
        if (inqRecord && inqRecord.phone) {
          finalClientPhone = inqRecord.phone;
          console.log(`[Exotel API] Resolved masked client phone from DB for inquiry ${inquiry_id}`);
        }
      } catch (err) {
        console.error(`[Exotel API] Failed to resolve client phone from DB:`, err.message);
      }
    }

    if (!salesman_phone || !finalClientPhone) {
      return NextResponse.json({ success: false, error: 'Both representative phone and client phone are required' }, { status: 400 });
    }

    const rawSid = exotel_sid || process.env.NEXT_PUBLIC_EXOTEL_SID || '';
    const rawApiKey = exotel_api_key || process.env.NEXT_PUBLIC_EXOTEL_API_KEY || '';
    const rawToken = exotel_token || process.env.EXOTEL_TOKEN || '';
    const rawVirtualNumber = exotel_virtual_number || process.env.NEXT_PUBLIC_EXOTEL_VIRTUAL_NUMBER || '';

    const sid = typeof rawSid === 'string' ? rawSid.trim() : rawSid;
    const apiKey = typeof rawApiKey === 'string' ? rawApiKey.trim() : rawApiKey;
    const token = typeof rawToken === 'string' ? rawToken.trim() : rawToken;
    const virtualNumber = typeof rawVirtualNumber === 'string' ? rawVirtualNumber.trim() : rawVirtualNumber;

    const isSandbox = !sid || !token || !virtualNumber;

    if (isSandbox) {
      // Sandbox mode: Simulate outbound dial transaction
      const mockCallSid = `mock_call_${Date.now()}`;
      
      // Auto-trigger a webhook callback in 5 seconds to mock a completed call log
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host');
      const webhookUrl = `${protocol}://${host}/api/calls/webhook?inquiry_id=${inquiry_id}&salesman_id=${salesman_id}&sandbox=true`;
      
      // Trigger async simulation call in background (non-blocking)
      setTimeout(async () => {
        try {
          const formData = new URLSearchParams();
          formData.append('CallSid', mockCallSid);
          formData.append('Duration', Math.floor(Math.random() * 90 + 30).toString()); // 30-120s
          formData.append('Status', 'completed');
          formData.append('RecordingUrl', `/recordings/simulated_exotel_${Date.now()}.mp3`);
          
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
          });
        } catch (e) {
          console.error('Failed to trigger mock telephony webhook callback:', e);
        }
      }, 5000);

      return NextResponse.json({ 
        success: true, 
        message: 'Sandbox dial started. Connection will establish in 5 seconds.', 
        callSid: mockCallSid, 
        sandbox: true 
      });
    }

    // Live Exotel integration
    const apiUsername = apiKey || sid; // Fallback to sid if apiKey is not configured/provided
    const authHeader = 'Basic ' + Buffer.from(apiUsername + ':' + token).toString('base64');
    
    // Resolve dynamic protocol/host for the callback URL
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const callbackUrl = `${protocol}://${host}/api/calls/webhook?inquiry_id=${inquiry_id}&salesman_id=${salesman_id}`;

    const formData = new URLSearchParams();
    formData.append('From', salesman_phone);
    formData.append('To', finalClientPhone);
    formData.append('CallerId', virtualNumber);
    formData.append('StatusCallback', callbackUrl);
    formData.append('Record', 'true');

    let apiEndpoint = `https://api.exotel.com/v1/Accounts/${sid}/Calls/connect.json`;

    console.log(`[Exotel API] Triggering call. Endpoint: ${apiEndpoint}, User: ${apiUsername}`);

    let exotelRes = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    let exotelText = await exotelRes.text();
    
    // Auto-retry with the India cluster endpoint if global returns 401 Unauthorized
    if (!exotelRes.ok && exotelRes.status === 401) {
      const indiaEndpoint = `https://api.in.exotel.com/v1/Accounts/${sid}/Calls/connect.json`;
      console.log(`[Exotel API] 401 Unauthorized on global cluster. Retrying with India cluster: ${indiaEndpoint}`);
      
      try {
        const retryRes = await fetch(indiaEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        });
        
        const retryText = await retryRes.text();
        if (retryRes.ok) {
          exotelRes = retryRes;
          exotelText = retryText;
          console.log(`[Exotel API] India cluster request succeeded!`);
        } else {
          exotelRes = retryRes;
          exotelText = retryText;
          console.log(`[Exotel API] India cluster retry also failed with status: ${retryRes.status}`);
        }
      } catch (retryErr) {
        console.error(`[Exotel API] Error during India cluster retry:`, retryErr);
      }
    }

    if (!exotelRes.ok) {
      return NextResponse.json({ success: false, error: `Exotel API error: ${exotelText}` }, { status: exotelRes.status });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Call initiated successfully.', 
      callSid: 'Live dial triggered',
      details: exotelText,
      sandbox: false 
    });

  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
