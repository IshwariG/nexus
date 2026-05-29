import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// In a real app, you would integrate a service like Twilio or AWS SNS here.
// For now, we simulate OTP generation.
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// In-memory store for OTPs (for demonstration purposes only). 
// In production, use Redis or a database table with an expiration timestamp.
global.otpStore = global.otpStore || {};

export async function POST(request) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required.' }, { status: 400 });
    }

    // Check if a user with this phone number exists
    // Note: This assumes the 'phone' column has been added to the 'Users' table
    const { data: user, error } = await supabase
      .from('Users')
      .select('username, role')
      .eq('phone', phone)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: 'Database error: Make sure the "phone" column exists in the Users table.' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'No account found with that phone number.' }, { status: 404 });
    }

    // Generate and store OTP
    const otp = generateOTP();
    global.otpStore[phone] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    };

    // Simulate sending OTP (in real app, this sends an SMS)
    console.log(`[SIMULATED SMS to ${phone}]: Your OTP for Homeland password reset is ${otp}`);

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully',
      // For demo purposes, we return the OTP in the response so you can test it easily
      demo_otp: otp 
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
