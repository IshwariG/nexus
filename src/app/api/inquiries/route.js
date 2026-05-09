import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('Inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Round-robin assignment if not explicitly assigned
    const salesmen = ['SR-9999', 'SR-1111', 'SR-2222', 'SR-3333', 'SR-4444'];
    let nextSalesman = salesmen[0];

    if (data.salesman_id) {
      nextSalesman = data.salesman_id;
    } else {
      const { data: lastInquiry } = await supabase
        .from('Inquiries')
        .select('status')
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (lastInquiry && lastInquiry.length > 0) {
        const lastStatus = lastInquiry[0].status || '';
        const parts = lastStatus.split('|');
        if (parts.length > 1) {
          const lastSalesman = parts[1];
          const lastIndex = salesmen.indexOf(lastSalesman);
          if (lastIndex !== -1) {
            nextSalesman = salesmen[(lastIndex + 1) % salesmen.length];
          }
        }
      }
    }

    // Use provided status or default to NEW|salesman
    const finalStatus = data.status || `NEW|${nextSalesman}`;

    const { data: newInquiry, error } = await supabase
      .from('Inquiries')
      .insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message || '',
          source: data.source || 'Website',
          status: finalStatus
        }
      ])
      .select();

    if (error) throw error;
    return NextResponse.json(newInquiry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { status } = await request.json();

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const { data, error } = await supabase
      .from('Inquiries')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
  }
}
