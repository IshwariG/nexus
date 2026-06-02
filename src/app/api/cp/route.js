import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    // 1. Get CP details
    const { data: cp, error: cpError } = await supabase
      .from('CP_Partners')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (cpError) throw cpError;

    if (!cp) {
      return NextResponse.json({ 
        success: true, 
        message: 'No CP Profile found. Please execute the database setup script to activate your broker profile.',
        stats: { referredLeads: 0, dealsClosed: 0, totalEarned: '₹ 0.00 L', pendingAmount: '₹ 0.00 L' },
        leads: [],
        commissions: [],
        payouts: []
      });
    }

    // 2. Fetch referred leads
    // Leads are linked by source: e.g., 'CP_Referral|cp101'
    const { data: leads, error: leadsError } = await supabase
      .from('Inquiries')
      .select('*')
      .eq('source', `CP_Referral|${username}`)
      .order('created_at', { ascending: false });

    if (leadsError) throw leadsError;

    // 3. Fetch commissions
    const { data: commissions, error: commError } = await supabase
      .from('Commissions')
      .select('*')
      .eq('cp_id', cp.id)
      .order('created_at', { ascending: false });

    if (commError) throw commError;

    // 4. Fetch payouts
    const { data: payouts, error: payError } = await supabase
      .from('Payouts')
      .select('*')
      .eq('cp_id', cp.id)
      .order('created_at', { ascending: false });

    if (payError) throw payError;

    // 5. Fetch Sales users for name lookup
    const { data: allUsers } = await supabase
      .from('Users')
      .select('username, full_name, employee_id, role, phone, is_active')
      .eq('role', 'Sales');

    // 5. Compute Stats
    // Parse numeric commission amounts (e.g., "₹ 28.50 L" -> 28.50)
    const parseAmount = (amtStr) => {
      if (!amtStr) return 0;
      const num = parseFloat(amtStr.replace(/[^\d.]/g, ''));
      return isNaN(num) ? 0 : num;
    };

    let totalEarnedVal = 0;
    let pendingVal = 0;
    
    commissions.forEach(c => {
      const val = parseAmount(c.amount);
      if (c.status === 'PAID') {
        totalEarnedVal += val;
      } else if (c.status === 'APPROVED' || c.status === 'PENDING') {
        pendingVal += val;
      }
    });

    const stats = {
      referredLeads: leads.length,
      dealsClosed: commissions.filter(c => c.status === 'PAID' || c.status === 'APPROVED').length,
      totalEarned: `₹ ${totalEarnedVal.toFixed(2)} L`,
      pendingAmount: `₹ ${pendingVal.toFixed(2)} L`
    };

    return NextResponse.json({
      success: true,
      cp,
      stats,
      leads,
      commissions,
      payouts,
      allUsers: allUsers || []
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const action = searchParams.get('action') || 'deactivate';

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    const targetActive = action === 'activate';

    // 1. Soft-delete/reactivate CP Partner profile
    const { error: profileError } = await supabase
      .from('CP_Partners')
      .update({ is_active: targetActive })
      .eq('username', username);
    if (profileError) throw profileError;

    // 2. Soft-delete/reactivate CP user account
    const { error: userError } = await supabase
      .from('Users')
      .update({ is_active: targetActive })
      .eq('username', username);
    if (userError) throw userError;

    return NextResponse.json({ success: true, message: `Channel Partner ${targetActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

