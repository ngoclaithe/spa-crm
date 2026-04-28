/**
 * Tương ứng JSON Prisma, chỉ dùng cho FE. Điều chỉnh theo thay đổi API.
 */
export type Service = {
  id: string;
  name: string;
  defaultPrice: number;
  categoryId: string;
  active: boolean;
};

export type ServiceCategory = {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
  services: Service[];
};

export type SalesChannel = { id: string; name: string; sortOrder: number; active: boolean };

export type OrderItem = {
  id: string;
  orderId: string;
  serviceId: string;
  sessions: number;
  unitPrice: number;
  lineTotal: number;
};

export type CrmLine = {
  id: string;
  type: 'POS_SALE' | 'DEBT_COLLECTION' | 'ADJUSTMENT';
  amount: number;
  customerDebtAfter: number | null;
  createdAt: string;
  description: string | null;
  customer: { id: string; name: string; phone: string } | null;
  order: { id: string; orderCode: string } | null;
};

export type OrderSummary = {
  id: string;
  orderCode: string;
  orderDate: string;
  subtotal: number;
  amountDue: number;
  amountReceived: number;
  orderBalance: number;
  createdAt: string;
  customer: { id: string; name: string; phone: string };
  salesChannel: { name: string } | null;
};

export type CreatePosInput = {
  orderDate?: string;
  customer: { phone: string; name: string };
  salesChannelId?: string;
  items: { serviceId: string; sessions: number; unitPrice?: number }[];
  discountType: 'VND' | 'PERCENT';
  discountValue: number;
  amountReceived: number;
  notes?: string;
};

export type CreateDebtInput = {
  customerId: string;
  amount: number;
  note?: string;
  /** YYYY-MM-DD */
  performedAt?: string;
};

export type Customer = {
  id: string;
  phone: string;
  name: string;
  totalDebt: number;
  createdAt: string;
  updatedAt: string;
};
