import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { key } from '@/shared/api/query-keys';
import { fetchCustomerActivity } from '@/shared/api/modules/customer-activity';
import { fetchCustomersList } from '@/shared/api/modules/customers';
import { formatVnd } from '@/shared/lib/money';

const MIN_SEARCH_LEN = 2;
const SEARCH_DEBOUNCE_MS = 300;

function catsFromOrder(
  items: { service: { category: { name: string } } }[],
) {
  const s = new Set<string>();
  items.forEach((it) => s.add(it.service.category.name));
  return Array.from(s).join(', ');
}

export function HistoryPage() {
  const qc = useQueryClient();
  const [phone, setPhone] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(
      () => setDebounced(phone.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(t);
  }, [phone]);

  useEffect(() => {
    setSelectedPhone(null);
  }, [debounced]);

  const listQ = useQuery({
    queryKey: key.customersSearch(debounced),
    queryFn: () => fetchCustomersList({ q: debounced, limit: 30 }),
    enabled: debounced.length >= MIN_SEARCH_LEN,
  });

  const actQ = useQuery({
    queryKey: key.customerActivity(selectedPhone ?? ''),
    queryFn: () => fetchCustomerActivity(selectedPhone!),
    enabled: Boolean(selectedPhone),
  });
  const d = actQ.data;

  const onSearch = () => {
    const t = phone.trim();
    if (t.length < MIN_SEARCH_LEN) {
      toast.error('Nhập ít nhất 2 số (hoặc tên) để tìm');
      return;
    }
    void (async () => {
      const list = await qc.fetchQuery({
        queryKey: key.customersSearch(t),
        queryFn: () => fetchCustomersList({ q: t, limit: 30 }),
      });
      if (list.length === 0) {
        setSelectedPhone(null);
        toast.error('Không tìm thấy khách phù hợp');
        return;
      }
      if (list.length === 1) {
        setSelectedPhone(list[0]!.phone);
        return;
      }
      toast.message('Có nhiều kết quả', {
        description: 'Chọn một dòng bên dưới',
      });
    })();
  };

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-2xl">
        <div className="card p-0 shadow">
          <h1 className="border-b border-slate-200 px-4 py-3 text-lg font-bold text-slate-900">
            Tra cứu lịch sử giao dịch
          </h1>
          <div className="p-4">
            <p className="mb-2 text-sm text-slate-500">
              Tìm theo một phần số di động hoặc tên; chọn đúng khách trong gợi ý, hoặc bấm Tra cứu khi chỉ có một kết
              quả.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="input min-w-0 flex-1"
                placeholder="Ví dụ: 09… hoặc tên"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              />
              <button
                type="button"
                className="btn-primary px-6"
                onClick={onSearch}
                disabled={actQ.isFetching}
              >
                {actQ.isFetching ? '...' : 'TRA CỨU'}
              </button>
            </div>

            {debounced.length >= MIN_SEARCH_LEN && (listQ.isFetching || (listQ.data && listQ.data.length > 0)) && (
              <ul
                className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white text-left text-sm shadow"
                role="listbox"
              >
                {listQ.isFetching && <li className="px-3 py-2 text-slate-500">Đang tìm…</li>}
                {!listQ.isFetching &&
                  (listQ.data ?? []).map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="flex w-full flex-wrap items-baseline justify-between gap-1 px-3 py-2 text-left hover:bg-slate-50"
                        onClick={() => setSelectedPhone(c.phone)}
                      >
                        <span className="font-mono text-slate-900">{c.phone}</span>
                        <span className="text-slate-600">{c.name}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            )}

            {actQ.isError && <p className="mt-2 text-sm text-rose-600">Lỗi tải.</p>}
            {!d?.customer && actQ.isFetched && actQ.isSuccess && selectedPhone && !actQ.isFetching && (
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
