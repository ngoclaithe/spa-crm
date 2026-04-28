import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/shell/AppShell';

const PosPage = lazy(() => import('@/features/pos/PosPage').then((m) => ({ default: m.PosPage })));
const DebtCollectionPage = lazy(
  () => import('@/features/debt/DebtCollectionPage').then((m) => ({ default: m.DebtCollectionPage })),
);
const RevenuePage = lazy(() => import('@/features/reports/RevenuePage').then((m) => ({ default: m.RevenuePage })));
const TransactionLogPage = lazy(
  () => import('@/features/crm/TransactionLogPage').then((m) => ({ default: m.TransactionLogPage })),
);
const DebtManagementPage = lazy(
  () => import('@/features/debt/DebtManagementPage').then((m) => ({ default: m.DebtManagementPage })),
);
const HistoryPage = lazy(() => import('@/features/orders/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const UiSettingsPage = lazy(
  () => import('@/features/settings/UiSettingsPage').then((m) => ({ default: m.UiSettingsPage })),
);
const CatalogPage = lazy(() => import('@/features/catalog/CatalogPage').then((m) => ({ default: m.CatalogPage })));
const CustomersPage = lazy(() => import('@/features/customers/CustomersPage').then((m) => ({ default: m.CustomersPage })));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-slate-500" role="status">
      Đang tải màn hình…
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/pos" replace />} />
          <Route path="pos" element={<PosPage />} />
          <Route path="thu-tien-no" element={<DebtCollectionPage />} />
          <Route path="doanh-thu" element={<RevenuePage />} />
          <Route path="nhat-ky" element={<TransactionLogPage />} />
          <Route path="cong-no" element={<DebtManagementPage />} />
          <Route path="tra-cuu" element={<HistoryPage />} />
          <Route path="giao-dien" element={<UiSettingsPage />} />
          <Route path="danh-muc" element={<CatalogPage />} />
          <Route path="khach-hang" element={<CustomersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </Suspense>
  );
}
