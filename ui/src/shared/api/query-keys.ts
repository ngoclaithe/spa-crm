export const key = {
  all: ['spa-crm'] as const,
  appearance: () => [...key.all, 'appearance'] as const,
  catalog: () => [...key.all, 'catalog'] as const,
  /** Danh sách cho POS (chỉ active) */
  serviceCategories: () => [...key.catalog(), 'service-categories', 'pos'] as const,
  /** Admin: tất cả loại + dịch vụ (kể cả ẩn) */
  serviceCategoriesAdmin: () => [...key.catalog(), 'service-categories', 'admin'] as const,
  salesChannels: () => [...key.catalog(), 'sales-channels'] as const,
  orderHistory: (q: string, from: string, to: string) =>
    [...key.all, 'order-history', q, from, to] as const,
  transactionLog: (from: string, to: string) =>
    [...key.all, 'tx-log', from, to] as const,
  revenue: (from: string, to: string) => [...key.all, 'revenue', from, to] as const,
  dashboard: (from: string, to: string) => [...key.all, 'dashboard', from, to] as const,
  transactionLedger: (from: string, to: string) =>
    [...key.all, 'transaction-ledger', from, to] as const,
  debtLedger: (asOf: string) => [...key.all, 'debt-ledger', asOf] as const,
  customerActivity: (phone: string) => [...key.all, 'activity', phone] as const,
  customers: () => [...key.all, 'customers'] as const,
  customersSearch: (q: string) => [...key.all, 'customers', 'search', q] as const,
} as const;
