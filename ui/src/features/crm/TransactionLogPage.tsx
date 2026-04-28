import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { key } from '@/shared/api/query-keys';
import { fetchTransactionLedger } from '@/shared/api/modules/reports';
import { formatVnd } from '@/shared/lib/money';
import { toDateInputString } from '@/shared/lib/dates';

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function fmtDate(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('vi-VN');
}

export function TransactionLogPage() {
  const [from, setFrom] = useState(() => startOfMonth());
  const [to, setTo] = useState(() => toDateInputString());
  const q = useQuery({
    queryKey: key.transactionLedger(from, to),
    queryFn: () => fetchTransactionLedger({ from, to }),
  });
  const d = q.data;

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden p-0">
        <div className="bg-brand-100/90 px-4 py-2">
          <h1 className="text-base font-bold text-slate-900">Nhật ký giao dịch</h1>
        </div>
        <div className="border-b border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs text-slate-500">Tra cứu theo thời gian (đơn POS theo orderDate, thu nợ theo ngày thực hiện)</p>
        </div>
        <div className="flex flex-wrap items-end gap-3 p-4">
          <div>
            <label className="label">Từ ngày</label>
            <input className="input w-40" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">Đến ngày</label>
            <input className="input w-40" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            onClick={() => void q.refetch()}
          >
            <Search className="h-4 w-4" />
            LỌC GIAO DỊCH
          </button>
        </div>
      </div>

      {q.isLoading && <p className="text-slate-500">Đang tải…</p>}
      {q.isError && <p className="text-rose-600">Lỗi tải.</p>}

      {d && d.rows.length === 0 && <p className="text-slate-500">Không có giao dịch trong kỳ.</p>}

      {d && d.rows.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-left text-sm text-slate-800">
            <thead className="bg-brand-50/90 text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="p-2">Ngày</th>
                <th className="p-2">Mã đơn</th>
                <th className="p-2">Khách hàng</th>
                <th className="p-2">Phân loại</th>
                <th className="p-2 text-right">Doanh thu</th>
                <th className="p-2 text-right">Thực thu</th>
                <th className="p-2 text-right">Còn nợ</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-amber-100 font-semibold">
                <td className="p-2" colSpan={4}>
                  TỔNG CỘNG GIAO DỊCH (đơn bán)
                </td>
                <td className="p-2 text-right tabular-nums text-slate-900">
                  {formatVnd(d.summary.doanhThu)}
                </td>
                <td className="p-2 text-right tabular-nums text-emerald-700">
                  {formatVnd(d.summary.thucThu)}
                </td>
                <td className="p-2 text-right font-semibold tabular-nums text-rose-700">
                  {formatVnd(d.summary.conNo)}
                </td>
              </tr>
              {d.rows.map((r) => (
                <tr
                  key={r.id}
                  className={r.kind === 'DEBT' ? 'border-t border-slate-100 bg-emerald-50/50' : 'border-t border-slate-100'}
                >
                  <td className="p-2 whitespace-nowrap text-slate-600">{fmtDate(r.date)}</td>
                  <td className="p-2 font-mono text-xs text-slate-800">{r.orderCode ?? '—'}</td>
                  <td className="p-2">
                    <div className="font-medium text-slate-900">{r.customerName}</div>
                    <div className="text-xs text-slate-500">{r.customerPhone}</div>
                  </td>
                  <td className="p-2">{r.phanLoai}</td>
                  <td className="p-2 text-right tabular-nums text-slate-800">{formatVnd(r.doanhThu)}</td>
                  <td className="p-2 text-right font-medium tabular-nums text-emerald-600">
                    {formatVnd(r.thucThu)}
                  </td>
                  <td className="p-2 text-right font-medium tabular-nums text-rose-600">
                    {r.conNo == null ? '—' : formatVnd(r.conNo)}
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
