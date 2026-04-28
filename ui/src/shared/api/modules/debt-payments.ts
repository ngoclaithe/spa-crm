import { http } from '../client';
import type { CreateDebtInput } from '../types/schema';

export async function createDebtPayment(body: CreateDebtInput) {
  const { data } = await http.post<{
    payment: { id: string; amount: number; createdAt: string };
    newTotalDebt: number;
  }>('/debt-payments', body);
  return data;
}
