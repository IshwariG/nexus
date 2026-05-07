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
      // Explicit assignment for leads captured by the salesman themselves
      nextSalesman = data.salesman_id;
    } else {
      // Get last inquiry to find who was assigned last
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

    const { data: newInquiry, error } = await supabase
      .from('Inquiries')
      .insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message || '',
          source: data.source || 'Website',
          status: `NEW|${nextSalesman}`
        }
      ])
      .select();

    if (error) throw error;
    return NextResponse.json(newInquiry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
