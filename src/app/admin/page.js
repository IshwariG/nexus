import "./admin.css";
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import Link from 'next/link';
import PortfolioTable from './PortfolioTable';
import SalesmanNewInquiryClient from './SalesmanNewInquiryClient';
import BuyerPaymentClient from './BuyerPaymentClient';
import VisitManagerClient from './VisitManagerClient';
import ChannelPartnerClient from './ChannelPartnerClient';
import SalesmanInquiryPipelineClient from './SalesmanInquiryPipelineClient';
import AdminViewClient from './AdminViewClient';
import BuyerPortalClient from './BuyerPortalClient';
import SalespersonCRMClient from './SalespersonCRMClient';

// BuyerView replaced by BuyerPortalClient

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function AdminDashboard(props) {
  const searchParams = await props.searchParams;
  const project = (searchParams && searchParams.project) || 'vanya-residences';

  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'Admin';
  const userId = cookieStore.get('user_id')?.value || 'Unknown';
  const isImpersonating = cookieStore.get('is_impersonating')?.value === 'true';
  
  let inquiries = [];
  let units = [];
  let buyers = [];
  let cpPartners = [];
  let commissions = [];
  let currentBuyer = null;
  let allUsers = [];
  let opportunities = [];
  
  try {
    const { data: iData } = await supabase.from('Inquiries').select('*').order('created_at', { ascending: false });
    if (iData) inquiries = iData;
    
    const { data: uData } = await supabase.from('PropertyUnits').select('*').order('unit_id', { ascending: true });
    if (uData) units = uData;

    const { data: bData } = await supabase.from('BuyerDetails').select('*');
    if (bData) buyers = bData;

    const { data: cpData } = await supabase.from('CP_Partners').select('*');
    if (cpData) cpPartners = cpData;

    const { data: usersData } = await supabase.from('Users').select('username, role, phone, full_name, employee_id');
    if (usersData) allUsers = usersData;

    const { data: commData } = await supabase.from('Commissions').select('*').order('created_at', { ascending: false });
    if (commData) commissions = commData;

    const { data: oppData } = await supabase.from('Opportunities').select('*').order('created_at', { ascending: false });
    if (oppData) opportunities = oppData;

    if (userRole === 'Buyer') {
      currentBuyer = buyers.find(b => b.username === userId);
    }
  } catch(e) {}
  
  if (userRole === 'Sales') {
    return <SalespersonCRMClient inquiries={inquiries} units={units} buyers={buyers} userId={userId} isImpersonating={isImpersonating} />;
  }

  if (userRole === 'Buyer') {
    return <BuyerPortalClient username={userId} buyerDetails={currentBuyer} inquiries={inquiries} units={units} />;
  }

  if (userRole === 'ChannelPartner') {
    return <ChannelPartnerClient username={userId} />;
  }
  
  return <AdminViewClient inquiries={inquiries} units={units} buyers={buyers} cpPartners={cpPartners} commissions={commissions} project={project} allUsers={allUsers} opportunities={opportunities} />;
}
