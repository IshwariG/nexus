import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { commission_id, status } = body;

    if (!commission_id || !status) {
      return NextResponse.json({ success: false, error: 'Commission ID and Status are required' }, { status: 400 });
    }

    // 1. Fetch current commission details
    const { data: commission, error: fetchError } = await supabase
      .from('Commissions')
      .select('*')
      .eq('id', commission_id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!commission) {
      return NextResponse.json({ success: false, error: 'Commission record not found' }, { status: 404 });
    }

    // 2. Update the status of the commission
    const { error: updateError } = await supabase
      .from('Commissions')
      .update({ status })
      .eq('id', commission_id);

    if (updateError) throw updateError;

    // 3. If transitioning to PAID, automatically generate a Payout record
    if (status === 'PAID') {
      const { error: payoutError } = await supabase
        .from('Payouts')
        .insert([
          {
            commission_id: commission_id,
            cp_id: commission.cp_id,
            amount: commission.amount,
            status: 'PAID',
            paid_at: new Date().toISOString()
          }
        ]);

      if (payoutError) {
        console.warn('Failed to insert automatic payout record:', payoutError.message);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
