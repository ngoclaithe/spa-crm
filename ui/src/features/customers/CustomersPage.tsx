import { useQuery } from '@tanstack/react-query';
import { key } from '@/shared/api/query-keys';
import { fetchCustomersList } from '@/shared/api/modules/customers';
import { formatVnd } from '@/shared/lib/money';

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function CustomersPage() {
  const q = useQuery({
    queryKey: key.customers(),
    queryFn: () => fetchCustomersList({ limit: 500 }),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Quản lý khách hàng</h1>
      <p className="text-sm text-slate-500">Danh sách khách đã lưu trên hệ thống (khi tạo đơn, thu nợ, v.v.).</p>

      {q.isLoading && <p className="text-slate-500">Đang tải…</p>}
      {q.isError && <p className="text-rose-600">Không tải được. Kiểm tra backend.</p>}

      {q.data && q.data.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">Chưa có khách hàng nào.</p>
      )}

      {q.data && q.data.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Số điện thoại</th>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3 text-right">Công nợ</th>
                <th className="px-4 py-3">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {q.data.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2.5 font-mono tabular-nums text-slate-900">{c.phone}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-rose-600">
                    {formatVnd(c.totalDebt)} đ
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{fmtDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
