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

    // --- Automatic Commission Allocation for Channel Partners ---
    if (data.source && data.source.startsWith('UNIT_ASSIGNMENT_')) {
      const unitId = data.source.replace('UNIT_ASSIGNMENT_', '');
      
      // 1. Check if there was a lead for this phone number referred by a CP
      const { data: cpLeads } = await supabase
        .from('Inquiries')
        .select('source')
        .eq('phone', data.phone)
        .like('source', 'CP_Referral|%')
        .order('created_at', { ascending: false });

      if (cpLeads && cpLeads.length > 0) {
        // Find the CP username from source (e.g. CP_Referral|cp101)
        const cpUsername = cpLeads[0].source.split('|')[1];
        
        // 2. Fetch the CP's profile for commission rate
        const { data: cpProfile } = await supabase
          .from('CP_Partners')
          .select('id, commission_rate')
          .eq('username', cpUsername)
          .maybeSingle();

        if (cpProfile) {
          // 3. Fetch the unit price
          const { data: unitData } = await supabase
            .from('PropertyUnits')
            .select('price')
            .eq('unit_id', unitId)
            .maybeSingle();

          if (unitData && unitData.price) {
            // 4. Calculate commission based on rate
            const parsePriceToLakhs = (priceStr) => {
              if (!priceStr) return 0;
              const cleaned = priceStr.replace(/[^\d.]/g, '');
              const val = parseFloat(cleaned);
              if (isNaN(val)) return 0;
              if (priceStr.toLowerCase().includes('cr')) {
                return val * 100; // 1 Cr = 100 Lakhs
              }
              return val;
            };

            const priceLakhs = parsePriceToLakhs(unitData.price);
            const rate = parseFloat(cpProfile.commission_rate) || 2.0;
            const commLakhs = (priceLakhs * rate) / 100;
            const formattedCommission = `₹ ${commLakhs.toFixed(2)} L`;

            // 5. Insert Commission Record
            await supabase
              .from('Commissions')
              .insert([
                {
                  cp_id: cpProfile.id,
                  client_name: data.name,
                  unit_id: unitId,
                  amount: formattedCommission,
                  status: 'APPROVED'
                }
              ]);
          }
        }
      }
    }

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
