import { http } from '../client';
import type { CrmLine } from '../types/schema';

export async function fetchTransactionLog(params: { from?: string; to?: string; limit?: number; offset?: number }) {
  const { data } = await http.get<CrmLine[]>('/transaction-log', { params });
  return data;
}
