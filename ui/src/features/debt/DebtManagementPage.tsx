import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { key } from '@/shared/api/query-keys';
import { fetchDebtLedger } from '@/shared/api/modules/reports';
import { formatVnd } from '@/shared/lib/money';
import { toDateInputString } from '@/shared/lib/dates';

export function DebtManagementPage() {
  const [asOf, setAsOf] = useState(() => toDateInputString());
  const q = useQuery({
    queryKey: key.debtLedger(asOf),
    queryFn: () => fetchDebtLedger({ asOf }),
  });
  const d = q.data;

  return (
    <div className="space-y-4">
      <div className="card p-0 overflow-hidden">
        <div className="border-b border-rose-100 bg-rose-50/50 px-4 py-2">
          <h1 className="text-base font-bold text-rose-700 sm:text-lg">Quản lý công nợ</h1>
        </div>
        <div className="flex flex-wrap items-end gap-3 p-4">
          <div>
            <label className="label">Tính nợ đến ngày</label>
            <input className="input max-w-xs" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
          </div>
          <button
            type="button"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-sky-600 px-4 text-sm font-bold text-white shadow hover:bg-sky-700"
            onClick={() => void q.refetch()}
          >
            CHỐT SỐ NỢ
          </button>
        </div>
        <p className="px-4 pb-3 text-xs text-slate-500">
          Cột theo tổng hóa đơn (đã thanh toán) đến kỳ; cột nợ hiện tại: sổ từng KH
        </p>
      </div>

      {q.isLoading && <p className="text-slate-500">Đang tải…</p>}
      {q.isError && <p className="text-rose-600">Lỗi tải.</p>}

      {d && d.rows.length === 0 && <p className="text-slate-500">Không có công nợ.</p>}

      {d && d.rows.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="p-2">Số điện thoại</th>
                <th className="p-2">Tên khách hàng</th>
                <th className="p-2 text-right">Tổng phải trả</th>
                <th className="p-2 text-right text-emerald-700">Tổng đã trả</th>
                <th className="p-2 text-right font-bold text-rose-700">Nợ hiện tại</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-amber-100 font-semibold text-slate-900">
                <td className="p-2" colSpan={2}>
                  TỔNG CÔNG NỢ ĐẾN NGÀY LỌC
                </td>
                <td className="p-2 text-right text-rose-800 tabular-nums">{formatVnd(d.summary.phai)}</td>
                <td className="p-2 text-right text-emerald-800 tabular-nums">{formatVnd(d.summary.da)}</td>
                <td className="p-2 text-right text-rose-800 tabular-nums">{formatVnd(d.summary.no)}</td>
              </tr>
              {d.rows.map((r) => (
                <tr key={r.phone} className="border-t border-slate-100">
                  <td className="p-2 font-mono tabular-nums">{r.phone}</td>
                  <td className="p-2 font-medium text-slate-900">{r.name}</td>
                  <td className="p-2 text-right text-rose-700 tabular-nums">{formatVnd(r.tongPhaiTra)}</td>
                  <td className="p-2 text-right font-medium text-emerald-600 tabular-nums">
                    {formatVnd(r.tongDaTra)}
                  </td>
                  <td className="p-2 text-right font-bold text-rose-600 tabular-nums">
                    {formatVnd(r.noHienTai)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
