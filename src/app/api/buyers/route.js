import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, role, phone, unit_id, total_amount, amount_paid, construction_progress, possession_date } = body;
    // Strip '%' sign and ensure construction_progress is stored as integer
    const progressInt = construction_progress !== undefined && construction_progress !== null
      ? parseInt(String(construction_progress).replace('%', ''), 10) || 0
      : 0;

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
        { username, password, role, phone: phone ? phone.trim() : null }
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
          construction_progress: progressInt, 
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

    // 3. Automatically synchronize and update the PropertyUnit owner and status in the occupancy grid
    await supabase
      .from('PropertyUnits')
      .update({ status: 'SOLD OUT', tag_color: username })
      .eq('unit_id', unit_id);

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
    const { unit_id, total_amount, amount_paid, construction_progress, possession_date, mobile, email, address, pan_number } = body;

    const updateObj = {};
    if (unit_id !== undefined) updateObj.unit_id = unit_id;
    if (total_amount !== undefined) updateObj.total_amount = total_amount;
    if (amount_paid !== undefined) updateObj.amount_paid = amount_paid;
    if (mobile !== undefined) updateObj.mobile = mobile;
    if (email !== undefined) updateObj.email = email;
    if (address !== undefined) updateObj.address = address;
    if (pan_number !== undefined) updateObj.pan_number = pan_number;
    if (construction_progress !== undefined) {
      // Strip '%' sign and ensure it is stored as integer
      updateObj.construction_progress = parseInt(String(construction_progress).replace('%', ''), 10) || 0;
    }
    if (possession_date !== undefined) updateObj.possession_date = possession_date;

    const { error } = await supabase
      .from('BuyerDetails')
      .update(updateObj)
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

    // Fetch the unit_id first so we can reset it to AVAILABLE in PropertyUnits
    const { data: buyerDetail } = await supabase
      .from('BuyerDetails')
      .select('unit_id')
      .eq('username', username)
      .maybeSingle();

    const unitIdToReset = buyerDetail?.unit_id;

    // 1. Delete from BuyerDetails
    const { error: detailError } = await supabase.from('BuyerDetails').delete().eq('username', username);
    if (detailError) throw detailError;

    // 2. Delete from Users
    const { error: userError } = await supabase.from('Users').delete().eq('username', username);
    if (userError) throw userError;

    // 3. Reset the unit status to AVAILABLE and clear owner name
    if (unitIdToReset) {
      await supabase
        .from('PropertyUnits')
        .update({ status: 'AVAILABLE', tag_color: '' })
        .eq('unit_id', unitIdToReset);
    }

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
