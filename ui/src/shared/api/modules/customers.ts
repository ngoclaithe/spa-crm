import { http } from '../client';
import type { Customer } from '../types/schema';

export async function searchCustomerByPhone(phone: string) {
  const { data } = await http.get<Customer | null>('/customers/search', {
    params: { phone },
  });
  return data;
}

export async function fetchCustomersList(params?: { q?: string; limit?: number; offset?: number }) {
  const { data } = await http.get<Customer[]>('/customers', {
    params: {
      limit: params?.limit ?? 200,
      offset: params?.offset ?? 0,
      q: params?.q?.trim() || undefined,
    },
  });
  return data;
}

export async function fetchCustomersWithDebt() {
  const { data } = await http.get<Customer[]>('/customers/with-debt');
  return data;
}
