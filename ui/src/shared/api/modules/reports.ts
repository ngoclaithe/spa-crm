import { http } from '../client';

export type RevenueResponse = {
  from: string | null;
  to: string | null;
  posThucThu: number;
  thuCongNo: number;
  tongTienVao: number;
  newCustomers: number;
};

export async function fetchRevenueSummary(params: { from?: string; to?: string }) {
  const { data } = await http.get<RevenueResponse>('/reports/revenue', { params });
  return data;
}

export type DashboardResponse = {
  filter: { from: string; to: string };
  thisMonth: { from: string; to: string; key: string };
  cards: {
    doanhThuThangNay: number;
    thucThuTrenDonThang: number;
    congNoDonThang: number;
    doanhThuLoc: number;
    thucThuTrenDonLoc: number;
    congNoTrenDonLoc: number;
  };
  customers: {
    today: number;
    thisMonth: number;
    inFilter: { total: number; new: number; returning: number };
  };
  chart: { dailyInCurrentMonth: { day: string; ymd: string; amountDue: number }[] };
  byChannel: { salesChannelId: string | null; name: string; revenue: number; orderCount: number }[];
  customerVisitsByChannel: { name: string; visits: number }[];
  byServiceCategory: { name: string; revenue: number }[];
  topVip: { name: string; phone: string; totalSpent: number }[];
};

export async function fetchDashboard(params: { from: string; to: string }) {
  const { data } = await http.get<DashboardResponse>('/reports/dashboard', { params });
  return data;
}

export type TransactionLedgerResponse = {
  from: string;
  to: string;
  rows: {
    kind: 'POS' | 'DEBT';
    id: string;
    date: string;
    orderCode: string | null;
    customerName: string;
    customerPhone: string;
    phanLoai: string;
    doanhThu: number;
    thucThu: number;
    conNo: number | null;
  }[];
  summary: { doanhThu: number; thucThu: number; conNo: number };
};

export async function fetchTransactionLedger(params: { from: string; to: string }) {
  const { data } = await http.get<TransactionLedgerResponse>('/reports/transaction-ledger', {
    params,
  });
  return data;
}

export type DebtLedgerResponse = {
  asOf: string;
  rows: { phone: string; name: string; tongPhaiTra: number; tongDaTra: number; noHienTai: number }[];
  summary: { phai: number; da: number; no: number };
};

export async function fetchDebtLedger(params: { asOf: string }) {
  const { data } = await http.get<DebtLedgerResponse>('/reports/debt-ledger', { params });
  return data;
}
