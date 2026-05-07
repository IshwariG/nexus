import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(request, { params }) {
  try {
    const { username } = params;
    const body = await request.json();
    const { unit_id, total_amount, amount_paid, construction_progress, possession_date } = body;

    const { error } = await supabase
      .from('BuyerDetails')
      .update({
        unit_id,
        total_amount,
        amount_paid,
        construction_progress,
        possession_date
      })
      .eq('username', username);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { username } = params;
    
    // 1. Delete from BuyerDetails
    const { error: detailError } = await supabase.from('BuyerDetails').delete().eq('username', username);
    if (detailError) throw detailError;

    // 2. Delete from Users
    const { error: userError } = await supabase.from('Users').delete().eq('username', username);
    if (userError) throw userError;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
