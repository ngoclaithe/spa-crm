import { useQuery } from '@tanstack/react-query';
import { Table2 } from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { key } from '@/shared/api/query-keys';
import { fetchDashboard } from '@/shared/api/modules/reports';
import { formatVnd } from '@/shared/lib/money';
import { toDateInputString } from '@/shared/lib/dates';

function startOfMonthYmd() {
  const d = new Date();
  d.setDate(1);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

const kpi = (label: string, v: string, className: string) => (
  <div className={`rounded-2xl p-4 text-white shadow ${className}`}>
    <p className="text-xs font-medium uppercase opacity-95">{label}</p>
    <p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">{v} đ</p>
  </div>
);

const tipProps = { contentStyle: { background: '#fff', border: '1px solid #e2e8f0', fontSize: 12 } as const };

export function RevenuePage() {
  const [from, setFrom] = useState(() => startOfMonthYmd());
  const [to, setTo] = useState(() => toDateInputString());

  const q = useQuery({
    queryKey: key.dashboard(from, to),
    queryFn: () => fetchDashboard({ from, to }),
  });

  const d = q.data;
  const daily = d?.chart.dailyInCurrentMonth ?? [];
  const byCh = d?.byChannel ?? [];
  const byCat = d?.byServiceCategory ?? [];
  const topV = d?.topVip ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Doanh thu tổng quát</h1>
        <p className="text-sm text-slate-500">
          Bộ lọc theo ngày tạo hóa đơn (POS) — cùng logic với báo cáo
        </p>
      </div>

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label">Từ ngày</label>
          <input className="input max-w-[11rem]" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">Đến ngày</label>
          <input className="input max-w-[11rem]" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button
          type="button"
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white shadow hover:bg-sky-700"
          onClick={() => void q.refetch()}
        >
          <Table2 className="h-4 w-4" aria-hidden />
          LỌC DỮ LIỆU
        </button>
      </div>

      {q.isLoading && <p className="text-slate-500">Đang tải…</p>}
      {q.isError && <p className="text-rose-600">Không tải dashboard. Kiểm tra API / DB.</p>}

      {d && (
        <>
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-700">Tình hình doanh thu</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {kpi('Doanh thu tháng này', formatVnd(d.cards.doanhThuThangNay), 'bg-violet-600')}
              {kpi('Doanh thu thời gian lọc', formatVnd(d.cards.doanhThuLoc), 'bg-sky-500')}
              {kpi('Đã thu thời gian lọc (trên đơn)', formatVnd(d.cards.thucThuTrenDonLoc), 'bg-emerald-600')}
              {kpi('Công nợ thời gian lọc (còn trên đơn)', formatVnd(d.cards.congNoTrenDonLoc), 'bg-rose-600')}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-bold uppercase text-slate-700">Thống kê khách hàng</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-cyan-600 p-4 text-white shadow">
                <p className="text-xs font-medium">Khách hôm nay (có mua)</p>
                <p className="mt-2 text-3xl font-bold tabular-nums">{d.customers.today}</p>
              </div>
              <div className="rounded-2xl bg-violet-500 p-4 text-white shadow">
                <p className="text-xs font-medium">Khách tháng này (có mua)</p>
                <p className="mt-2 text-3xl font-bold tabular-nums">{d.customers.thisMonth}</p>
              </div>
              <div className="card col-span-1 grid grid-cols-3 gap-2 p-4 sm:col-span-2">
                <p className="col-span-3 text-xs font-semibold uppercase text-slate-500">
                  Khách trong thời gian lọc
                </p>
                <div>
                  <p className="text-xs text-slate-500">Tổng</p>
                  <p className="text-2xl font-bold text-sky-600 tabular-nums">{d.customers.inFilter.total}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Mới</p>
                  <p className="text-2xl font-bold text-emerald-600 tabular-nums">{d.customers.inFilter.new}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Cũ</p>
                  <p className="text-2xl font-bold text-amber-600 tabular-nums">
                    {d.customers.inFilter.returning}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="card p-4">
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-800">Doanh thu theo từng ngày (tháng hiện tại)</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(v) => (v >= 1_000_000 ? `${v / 1_000_000}M` : `${v / 1000}k`)}
                  />
                  <Tooltip {...tipProps} formatter={(v) => [formatVnd(v as number) + ' đ', 'Doanh thu']} />
                  <Bar dataKey="amountDue" name="Doanh thu" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card p-4">
              <h3 className="mb-2 text-sm font-bold text-slate-800">Doanh thu theo kênh bán (lọc)</h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCh} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} height={50} />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(v) => (v >= 1_000_000 ? `${v / 1_000_000}M` : `${v}`)}
                    />
                    <Tooltip {...tipProps} formatter={(v) => [formatVnd(v as number) + ' đ', 'Doanh thu']} />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                      {byCh.map((_, i) => (
                        <Cell key={i} fill={['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'][i % 5]!} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card p-4">
              <h3 className="mb-2 text-sm font-bold text-slate-800">Lượt khách theo kênh bán (số đơn)</h3>
              <table className="w-full text-left text-sm text-slate-800">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="border-b border-slate-200 py-2">Tên kênh</th>
                    <th className="border-b border-slate-200 py-2 text-right">Lượt</th>
                  </tr>
                </thead>
                <tbody>
                  {d.customerVisitsByChannel.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-4 text-slate-500">
                        Chưa có
                      </td>
                    </tr>
                  )}
                  {d.customerVisitsByChannel.map((r) => (
                    <tr key={r.name} className="border-b border-slate-100">
                      <td className="py-2">{r.name}</td>
                      <td className="py-2 text-right tabular-nums">{r.visits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card p-4 lg:col-span-1">
              <h3 className="mb-2 text-sm font-bold text-slate-800">Doanh thu theo loại dịch vụ (lọc)</h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={byCat}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(v) => (v >= 1_000_000 ? `${v / 1_000_000}M` : `${v / 1000}k`)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 10, fill: '#475569' }}
                    />
                    <Tooltip {...tipProps} formatter={(v) => [formatVnd(v as number) + ' đ', '']} />
                    <Bar dataKey="revenue" fill="#6366f1" barSize={18} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card border-amber-200 bg-amber-50/50 p-4 lg:col-span-1">
              <h3 className="mb-2 text-sm font-bold text-amber-900">Top 5 theo tổng cần thu (kỳ lọc)</h3>
              <table className="w-full text-left text-sm text-slate-800">
                <thead className="text-xs text-slate-500">
                  <tr>
                    <th className="py-1">#</th>
                    <th className="py-1">Khách hàng</th>
                    <th className="py-1 text-right">Chi</th>
                  </tr>
                </thead>
                <tbody>
                  {topV.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-slate-500">
                        Chưa có
                      </td>
                    </tr>
                  )}
                  {topV.map((r, i) => (
                    <tr key={r.phone} className="border-t border-amber-200/50">
                      <td className="py-1.5">{i + 1}</td>
                      <td className="py-1.5">
                        {r.name}
                        <span className="ml-1 text-xs text-slate-500">({r.phone})</span>
                      </td>
                      <td className="py-1.5 text-right font-medium text-rose-600 tabular-nums">
                        {formatVnd(r.totalSpent)} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
