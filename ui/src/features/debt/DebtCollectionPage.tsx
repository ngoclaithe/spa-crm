import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { searchCustomerByPhone } from '@/shared/api/modules/customers';
import { createDebtPayment } from '@/shared/api/modules/debt-payments';
import { key } from '@/shared/api/query-keys';
import type { Customer } from '@/shared/api/types/schema';
import { CustomerPhoneCombobox } from '@/shared/ui/CustomerPhoneCombobox';
import { formatVnd } from '@/shared/lib/money';
import { toDateInputString } from '@/shared/lib/dates';

export function DebtCollectionPage() {
  const qc = useQueryClient();
  const [performedAt, setPerformedAt] = useState(() => toDateInputString());
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nameId = useId();

  const searchQ = useQuery({
    queryKey: ['spa-crm', 'customer-search', phone.trim()] as const,
    queryFn: () => searchCustomerByPhone(phone.trim()),
    enabled: false,
  });

  const m = useMutation({
    mutationFn: createDebtPayment,
    onSuccess: (data) => {
      setAmount('');
      setNote('');
      setPhone('');
      setCustomerId(null);
      setActiveCustomer(null);
      setPerformedAt(toDateInputString());
      void qc.invalidateQueries({ queryKey: key.all });
      toast.success(`Đã lưu phiếu thu nợ. Còn nợ: ${formatVnd(data.newTotalDebt)} đ`);
    },
  });

  const onLookup = async () => {
    setError(null);
    if (!phone.trim()) {
      setError('Nhập SĐT');
      return;
    }
    const res = await searchQ.refetch();
    if (!res.data) {
      setError('Không tìm thấy đúng SĐT. Chọn từ gợi ý hoặc tạo khách từ POS trước.');
      setCustomerId(null);
      setActiveCustomer(null);
    } else {
      setActiveCustomer(res.data);
      setCustomerId(res.data.id);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerId) {
      setError('Chọn khách từ gợi ý theo SĐT hoặc bấm Kiểm tra sau khi nhập đúng số.');
      return;
    }
    const n = Math.floor(parseInt(String(amount).replace(/\D/g, ''), 10) || 0);
    if (n < 1) {
      setError('Nhập số tiền thu (VNĐ) hợp lệ.');
      return;
    }
    m.mutate(
      {
        customerId,
        amount: n,
        note: note.trim() || undefined,
        performedAt,
      },
      { onError: (err) => setError(err instanceof Error ? err.message : 'Lỗi lưu') },
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <form onSubmit={onSubmit} className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-white shadow-md">
        <div className="bg-brand-100/90 px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight text-emerald-800">Ghi Nhận Thu Tiền Nợ</h1>
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
              {error}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:items-end">
            <div>
              <label className="label" htmlFor="pad">
                Ngày thực hiện
              </label>
              <input
                id="pad"
                className="input"
                type="date"
                value={performedAt}
                onChange={(e) => setPerformedAt(e.target.value)}
                disabled={m.isPending}
              />
            </div>
            <div>
              <label className="label" htmlFor={nameId + 'p'}>
                SĐT khách <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <CustomerPhoneCombobox
                    id={nameId + 'p'}
                    value={phone}
                    onChange={(v) => {
                      setPhone(v);
                      setCustomerId(null);
                      setActiveCustomer(null);
                    }}
                    onSelectCustomer={(c) => {
                      setActiveCustomer(c);
                      setCustomerId(c.id);
                      setError(null);
                    }}
                    disabled={m.isPending}
                    placeholder="Gõ SĐT — chọn khách trong gợi ý"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary flex-shrink-0"
                  onClick={() => void onLookup()}
                >
                  Kiểm tra
                </button>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="cname2">
                Tên khách hàng
              </label>
              <input
                id="cname2"
                className="input border-slate-200 bg-slate-100"
                value={activeCustomer?.name ?? ''}
                readOnly
                placeholder="(chọn từ gợi ý hoặc kiểm tra SĐT)"
                disabled
              />
            </div>
          </div>

          {activeCustomer && (
            <p className="text-sm text-slate-600">
              Công nợ hiện tại:{' '}
              <span className="font-semibold text-rose-600">
                {formatVnd(activeCustomer.totalDebt)} đ
              </span>
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="amt2">
                Số tiền thu vào (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                id="amt2"
                className="input text-lg font-medium tabular-nums"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="numeric"
                placeholder="0"
                disabled={!customerId || m.isPending}
              />
            </div>
            <div>
              <label className="label" htmlFor="n2">
                Ghi chú (lý do thu)
              </label>
              <input
                id="n2"
                className="input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Thu nợ cũ…"
                disabled={!customerId || m.isPending}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 py-3 text-center text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
            disabled={!customerId || m.isPending}
          >
            {m.isPending ? 'Đang lưu…' : 'LƯU PHIẾU THU NỢ'}
          </button>
        </div>
      </form>
    </div>
  );
}
