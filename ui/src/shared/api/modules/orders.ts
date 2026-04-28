import { http } from '../client';
import type { CreatePosInput, OrderSummary } from '../types/schema';

export async function createPosOrder(body: CreatePosInput) {
  const { data } = await http.post<unknown>('/orders/pos', body);
  return data;
}

export async function fetchOrderHistory(params: {
  q?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) {
  const { data } = await http.get<OrderSummary[]>('/orders/history', { params });
  return data;
}

export async function fetchOrderById(id: string) {
  const { data } = await http.get<unknown>(`/orders/${id}`);
  return data;
}
