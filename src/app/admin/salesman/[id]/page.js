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

  try {
    const { data: iData } = await supabase.from('Inquiries').select('*').order('created_at', { ascending: false });
    if (iData) inquiries = iData;

    const { data: uData } = await supabase.from('PropertyUnits').select('*').order('unit_id', { ascending: true });
    if (uData) units = uData;

    const { data: bData } = await supabase.from('BuyerDetails').select('*');
    if (bData) buyers = bData;
  } catch (e) {}

  return (
    <SalespersonCRMClient
      inquiries={inquiries}
      units={units}
      buyers={buyers}
      userId={salesmanId}
      isImpersonating={true}
    />
  );
}
