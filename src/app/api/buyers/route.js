import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, role, unit_id, total_amount, amount_paid, construction_progress, possession_date } = body;

    // Check if unit is already taken
    const { data: existingUnit } = await supabase
      .from('BuyerDetails')
      .select('unit_id')
      .eq('unit_id', unit_id)
      .single();

    if (existingUnit) {
      return NextResponse.json({ success: false, error: `Unit ${unit_id} is already assigned to another buyer.` }, { status: 400 });
    }

    // 1. Create User entry for login
    const { error: userError } = await supabase
      .from('Users')
      .insert([
        { username, password, role }
      ]);

    if (userError) {
      return NextResponse.json({ success: false, error: 'User creation failed: ' + userError.message }, { status: 400 });
    }

    // 2. Create BuyerDetails entry
    const { error: detailsError } = await supabase
      .from('BuyerDetails')
      .insert([
        { 
          username, 
          unit_id, 
          total_amount, 
          amount_paid, 
          construction_progress, 
          possession_date,
          milestones: [
            { step: "Foundation", status: "COMPLETED" },
            { step: "Structure", status: "IN PROGRESS" },
            { step: "Finishing", status: "PENDING" },
            { step: "Handover", status: "PENDING" }
          ]
        }
      ]);

    if (detailsError) {
      // Cleanup the user if details creation fails
      await supabase.from('Users').delete().eq('username', username);
      return NextResponse.json({ success: false, error: 'Buyer details failed: ' + detailsError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
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

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

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

export async function GET() {
  try {
    const { data, error } = await supabase.from('BuyerDetails').select('*');
    if (error) throw error;
    return NextResponse.json({ success: true, buyers: data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
