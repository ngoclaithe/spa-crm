import { http } from '../client';

type ActivityOrderItem = {
  lineTotal: number;
  service: {
    name: string;
    category: { name: string; id: string };
  };
};

export type ActivityOrder = {
  id: string;
  orderCode: string;
  orderDate: string;
  amountDue: number;
  amountReceived: number;
  orderBalance: number;
  items: ActivityOrderItem[];
  salesChannel: { name: string } | null;
};

export type ActivityDebt = {
  id: string;
  amount: number;
  performedAt: string;
  note: string | null;
};

export type CustomerActivityResponse = {
  customer: { id: string; name: string; phone: string; totalDebt: number } | null;
  orders: ActivityOrder[];
  debtPayments: ActivityDebt[];
};

export async function fetchCustomerActivity(phone: string) {
  const { data } = await http.get<CustomerActivityResponse>('/customers/activity', {
    params: { phone: phone.trim() },
  });
  return data;
}
