import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get('zone');
    const cpUsername = searchParams.get('cp_username');

    let query = supabase.from('SourcingMetrics').select('*').order('created_at', { ascending: false });

    if (zone) {
      query = query.eq('zone', zone);
    }
    if (cpUsername) {
      query = query.eq('cp_username', cpUsername);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { cp_username, zone, walk_in_target, walk_in_actual } = body;

    if (!cp_username) {
      return NextResponse.json({ success: false, error: 'CP Username is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('SourcingMetrics')
      .insert([
        {
          cp_username,
          zone: zone || 'East',
          walk_in_target: parseInt(walk_in_target) || 0,
          walk_in_actual: parseInt(walk_in_actual) || 0,
          week_start: new Date().toISOString().split('T')[0]
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, walk_in_actual, walk_in_target } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Metric ID is required' }, { status: 400 });
    }

    const updateObj = {};
    if (walk_in_actual !== undefined) updateObj.walk_in_actual = parseInt(walk_in_actual);
    if (walk_in_target !== undefined) updateObj.walk_in_target = parseInt(walk_in_target);

    const { data, error } = await supabase
      .from('SourcingMetrics')
      .update(updateObj)
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
