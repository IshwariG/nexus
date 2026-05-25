"use server";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function impersonateSales(salesmanId) {
  const cookieStore = await cookies();
  cookieStore.set('user_role', 'Sales', { path: '/' });
  cookieStore.set('user_id', salesmanId, { path: '/' });
  cookieStore.set('is_impersonating', 'true', { path: '/' });
  redirect('/admin');
}

export async function revertToAdmin() {
  const cookieStore = await cookies();
  cookieStore.set('user_role', 'Admin', { path: '/' });
  cookieStore.set('user_id', 'Admin', { path: '/' });
  cookieStore.delete('is_impersonating');
  redirect('/admin');
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('user_role');
  cookieStore.delete('user_id');
  cookieStore.delete('is_impersonating');
  redirect('/');
}
