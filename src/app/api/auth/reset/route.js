import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

global.otpStore = global.otpStore || {};

export async function POST(request) {
  try {
    const { phone, otp, newPassword } = await request.json();
    
    if (!phone || !otp || !newPassword) {
      return NextResponse.json({ success: false, error: 'Phone, OTP, and new password are required.' }, { status: 400 });
    }

    // Verify OTP
    const record = global.otpStore[phone];
    if (!record) {
      return NextResponse.json({ success: false, error: 'No OTP requested for this phone number.' }, { status: 400 });
    }

    if (Date.now() > record.expiresAt) {
      delete global.otpStore[phone];
      return NextResponse.json({ success: false, error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (record.otp !== otp) {
      return NextResponse.json({ success: false, error: 'Invalid OTP.' }, { status: 400 });
    }

    // OTP is valid. Update the password.
    const { error: updateError } = await supabase
      .from('Users')
      .update({ password: newPassword })
      .eq('phone', phone);

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Failed to update password.' }, { status: 500 });
    }

    // Clear OTP after successful reset
    delete global.otpStore[phone];

    return NextResponse.json({ success: true, message: 'Password reset successfully!' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
