import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('PropertyUnits')
      .select('*')
      .order('unit_id', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { unit_id, floor, type, area, price, status } = data;
    
    if (!unit_id || !floor) {
      return NextResponse.json({ error: 'unit_id and floor are required' }, { status: 400 });
    }
    
    const { data: newUnit, error } = await supabase
      .from('PropertyUnits')
      .insert([
        {
          unit_id,
          floor,
          type: type || '3BHK',
          area: area || '2400',
          price: price || '₹ 2.50 Cr',
          status: status || 'AVAILABLE',
          img: '/images/hero_slider_2_1777798109562.png'
        }
      ])
      .select();
      
    if (error) throw error;
    return NextResponse.json({ success: true, data: newUnit });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to add unit' }, { status: 500 });
  }
}

