import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (code) {
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!sessionError && sessionData?.user) {
      const email = sessionData.user.email;
      
      // Look up user in Users table
      let { data: user, error: dbError } = await supabase
        .from('Users')
        .select('*')
        .eq('username', email)
        .maybeSingle();
        
      if (dbError) {
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Database Lookup Error: ' + dbError.message)}`);
      }
      
      // Auto-register if user doesn't exist
      if (!user) {
        const tempPassword = 'oauth_' + Math.random().toString(36).slice(-8);
        const { data: newUser, error: insertError } = await supabase
          .from('Users')
          .insert([
            { username: email, password: tempPassword, role: 'Buyer' }
          ])
          .select()
          .maybeSingle();
          
        if (insertError) {
          return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Auto-Registration Error: ' + insertError.message)}`);
        }
        
        user = newUser;
        
        // Also create a entry in BuyerDetails if the role is Buyer
        await supabase
          .from('BuyerDetails')
          .insert([
            {
              username: email,
              unit_id: null,
              construction_progress: 0,
              total_amount: '₹ 0.00',
              amount_paid: '₹ 0.00',
              documents: [],
              milestones: [
                { step: "Verification", status: "COMPLETED" },
                { step: "Unit Assignment", status: "PENDING" },
                { step: "Agreement", status: "PENDING" },
                { step: "Possession", status: "PENDING" }
              ]
            }
          ]);
      }
      
      if (user) {
        const cookieStore = await cookies();
        cookieStore.set('user_role', user.role, { path: '/' });
        cookieStore.set('user_id', user.username, { path: '/' });
        
        // Redirect to admin dashboard
        return NextResponse.redirect(`${origin}/admin`);
      }
    } else {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(sessionError?.message || 'OAuth exchange failed')}`);
    }
  }
  
  // Return to login if no code or failure
  return NextResponse.redirect(`${origin}/login?error=Invalid auth callback request`);
}
