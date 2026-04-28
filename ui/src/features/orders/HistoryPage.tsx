import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { key } from '@/shared/api/query-keys';
import { fetchCustomerActivity } from '@/shared/api/modules/customer-activity';
import { formatVnd } from '@/shared/lib/money';

function catsFromOrder(
  items: { service: { category: { name: string } } }[],
) {
  const s = new Set<string>();
  items.forEach((it) => s.add(it.service.category.name));
  return Array.from(s).join(', ');
}

export function HistoryPage() {
  const [phone, setPhone] = useState('');
  const [qPhone, setQPhone] = useState<string | null>(null);
  const q = useQuery({
    queryKey: key.customerActivity(qPhone ?? ''),
    queryFn: () => fetchCustomerActivity(qPhone!),
    enabled: Boolean(qPhone && qPhone.length > 0),
  });

  const onSearch = () => {
    const t = phone.trim();
    if (!t) {
      return;
    }
    if (qPhone === t) {
      void q.refetch();
    } else {
      setQPhone(t);
    }
  };
  const d = q.data;

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-2xl">
        <div className="card p-0 shadow">
          <h1 className="border-b border-slate-200 px-4 py-3 text-lg font-bold text-slate-900">
            Tra cứu lịch sử giao dịch
          </h1>
          <div className="p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="input min-w-0 flex-1"
                placeholder="Nhập SĐT cần tra cứu…"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              />
              <button type="button" className="btn-primary px-6" onClick={onSearch} disabled={q.isFetching}>
                {q.isFetching ? '...' : 'TRA CỨU'}
              </button>
            </div>
            {q.isError && <p className="mt-2 text-sm text-rose-600">Lỗi tải.</p>}
            {!d?.customer && q.isFetched && q.isSuccess && qPhone && !q.isFetching && (
              <p className="mt-3 text-sm text-amber-800">Không tìm thấy khách với số này.</p>
            )}
            {d?.customer && (
              <div className="mt-4">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{d.customer.name}</span> — SĐT{' '}
                  {d.customer.phone} — Nợ hiện tại:{' '}
                  <span className="font-semibold text-rose-600">
                    {formatVnd(d.customer.totalDebt)} đ
                  </span>
                </p>
                <div className="mt-4 max-h-96 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-sm">
                  {d.debtPayments.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap justify-between gap-2 border-b border-emerald-200/60 bg-emerald-50/50 px-2 py-2"
                    >
                      <span className="text-slate-500">
                        {new Date(p.performedAt).toLocaleString('vi-VN')}{' '}
                        <span className="font-medium text-slate-800">THU NỢ</span>
                      </span>
                      <span className="font-medium text-emerald-700">
                        +{formatVnd(p.amount)} đ
                        {p.note && <span className="ml-1 text-slate-500">({p.note})</span>}
                      </span>
                    </div>
                  ))}
                  {d.orders.map((o) => (
                    <div key={o.id} className="border-b border-slate-200 px-2 py-2 last:border-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs text-sky-700">{o.orderCode}</span>
                          <span className="ml-2 text-xs text-slate-500">
                            {new Date(o.orderDate).toLocaleDateString('vi-VN')}
                            {o.salesChannel && ` · ${o.salesChannel.name}`}
                          </span>
                        </div>
                        <div className="text-right text-xs">
                          <span className="text-slate-600">DS: {formatVnd(o.amountDue)}</span> ·
                          <span className="text-emerald-600"> Thu: {formatVnd(o.amountReceived)}</span> ·
                          <span className="text-rose-600"> Nợ: {formatVnd(o.orderBalance)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">{catsFromOrder(o.items)}</p>
                    </div>
                  ))}
                  {d.debtPayments.length === 0 && d.orders.length === 0 && (
                    <p className="text-center text-slate-500">Chưa có giao dịch</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
