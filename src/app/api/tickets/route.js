import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    let query = supabase.from('SupportTickets').select('*').order('created_at', { ascending: false });

    if (username) {
      query = query.eq('username', username);
    }

    const { data: tickets, error } = await query;
    if (error) throw error;

    // --- Dynamic 5-minute Auto-Escalation Check ---
    // If a ticket has been 'Open' for more than 5 minutes, we update it to 'Escalated'
    const updatedTickets = [];
    const now = new Date();
    
    for (const t of (tickets || [])) {
      const createdTime = new Date(t.created_at);
      const elapsedMinutes = (now.getTime() - createdTime.getTime()) / (1000 * 60);

      if (t.status === 'Open' && elapsedMinutes >= 5) {
        // Escalate ticket in database
        const { data: updatedRecord } = await supabase
          .from('SupportTickets')
          .update({ status: 'Escalated', escalated_at: now.toISOString() })
          .eq('id', t.id)
          .select()
          .maybeSingle();
        
        if (updatedRecord) {
          updatedTickets.push(updatedRecord);
          // Also append an alert inquiry so the admin dashboard notices
          let targetSalesman = 'unassigned';
          try {
            const { data: dbSales } = await supabase
              .from('Users')
              .select('username')
              .eq('role', 'Sales')
              .neq('is_active', false);
            
            if (dbSales && dbSales.length > 0) {
              targetSalesman = dbSales[0].username;
            }
          } catch (err) {}

          try {
            await supabase.from('Inquiries').insert([
              {
                name: 'SYSTEM ESCALATION ALERT',
                phone: '0000000000',
                email: 'support@system.com',
                message: `[Ticket Escalated] Buyer ${t.username}'s complaint regarding "${t.category}" has remained unanswered for over 5 minutes. Immediate response required.`,
                source: 'SYSTEM_ALERT',
                status: `NEW|${targetSalesman}`
              }
            ]);
          } catch(e) {}
        } else {
          updatedTickets.push(t);
        }
      } else {
        updatedTickets.push(t);
      }
    }

    return NextResponse.json({ success: true, tickets: updatedTickets });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, category, description } = body;

    if (!username || !category || !description) {
      return NextResponse.json({ success: false, error: 'Username, Category, and Description are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('SupportTickets')
      .insert([
        {
          username,
          category,
          description,
          status: 'Open',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, ticket: data[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Ticket ID and Status are required' }, { status: 400 });
    }

    const updateObj = { status };
    if (status === 'Escalated') {
      updateObj.escalated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('SupportTickets')
      .update(updateObj)
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, ticket: data[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
