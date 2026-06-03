import "../../admin.css";
import { supabase } from '@/lib/supabase';
import SalespersonCRMClient from '../../SalespersonCRMClient';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function SalesmanPortalPage(props) {
  const params = await props.params;
  const salesmanId = params.id; // e.g. SR-9999

  let inquiries = [];
  let units = [];
  let buyers = [];
  let cpPartners = [];
  let allUsers = [];

  try {
    const { data: iData } = await supabase.from('Inquiries').select('*').order('created_at', { ascending: false });
    if (iData) inquiries = iData;

    const { data: uData } = await supabase.from('PropertyUnits').select('*').order('unit_id', { ascending: true });
    if (uData) units = uData;

    const { data: bData } = await supabase.from('BuyerDetails').select('*');
    if (bData) buyers = bData;

    const { data: cpData } = await supabase.from('CP_Partners').select('*');
    if (cpData) cpPartners = cpData;

    const { data: usersData } = await supabase.from('Users').select('username, role, phone, email, full_name, employee_id, is_active');
    if (usersData) allUsers = usersData;
  } catch (e) {}

  return (
    <SalespersonCRMClient
      inquiries={inquiries}
      units={units}
      buyers={buyers}
      userId={salesmanId}
      isImpersonating={true}
      cpPartners={cpPartners}
      allUsers={allUsers}
    />
  );
}
