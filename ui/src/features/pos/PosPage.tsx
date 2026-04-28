import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { type Resolver, Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { CustomerPhoneCombobox } from '@/shared/ui/CustomerPhoneCombobox';
import { key } from '@/shared/api/query-keys';
import { fetchSalesChannels, fetchServiceCategories } from '@/shared/api/modules/catalog';
import { createPosOrder } from '@/shared/api/modules/orders';
import type { SalesChannel, Service, ServiceCategory } from '@/shared/api/types/schema';
import { computeAmountDue, formatVnd } from '@/shared/lib/money';
import { toDateInputString } from '@/shared/lib/dates';
import { type PosFormValues, posFormSchema } from './pos-form-schema';
import { POS_SALES_CHANNEL_NAMES } from './pos-channels';
import { cn } from '@/shared/lib/cn';

function buildServiceIndex(cats: ServiceCategory[] | undefined) {
  const byId = new Map<string, Service>();
  const byCategory = new Map<string, Service[]>();
  (cats ?? []).forEach((c) => {
    byCategory.set(c.id, c.services);
    c.services.forEach((s) => {
      byId.set(s.id, s);
    });
  });
  return { byId, byCategory };
}

export function PosPage() {
  const qc = useQueryClient();
  const catQ = useQuery({
    queryKey: key.serviceCategories(),
    queryFn: () => fetchServiceCategories(),
  });
  const chQ = useQuery({
    queryKey: key.salesChannels(),
    queryFn: () => fetchSalesChannels(),
  });
  const { byId, byCategory } = useMemo(() => buildServiceIndex(catQ.data), [catQ.data]);

  const posChannelOptions = useMemo(() => {
    const list = chQ.data ?? [];
    return POS_SALES_CHANNEL_NAMES.map((name) => list.find((c) => c.name === name)).filter(
      (c): c is SalesChannel => c != null,
    );
  }, [chQ.data]);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<PosFormValues>({
    resolver: zodResolver(posFormSchema) as unknown as Resolver<PosFormValues>,
    defaultValues: {
      orderDate: toDateInputString(),
      customerPhone: '',
      customerName: '',
      salesChannelId: '',
      items: [{ categoryId: '', serviceId: '', sessions: 1, unitPrice: 0 }],
      discountType: 'VND',
      discountValue: 0,
      amountReceived: 0,
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const itemsWatch = useWatch({ control, name: 'items' });
  const discountType = useWatch({ control, name: 'discountType' });
  const discountValue = useWatch({ control, name: 'discountValue' });
  const amountReceived = useWatch({ control, name: 'amountReceived' });

  const { subtotal, amountDue, remain } = useMemo(() => {
    const lines = (itemsWatch ?? []) as { unitPrice: number; sessions: number }[];
    const sub = lines.reduce((a, b) => a + Math.max(0, b.unitPrice) * b.sessions, 0);
    const due = computeAmountDue(
      sub,
      discountType ?? 'VND',
      Number(discountValue ?? 0) || 0,
    );
    const paid = Math.max(0, Number(amountReceived ?? 0) || 0);
    return { subtotal: sub, amountDue: due, remain: Math.max(0, due - paid) };
  }, [itemsWatch, discountType, discountValue, amountReceived]);

  const onCategory = useCallback(
    (index: number, categoryId: string) => {
      setValue(`items.${index}.categoryId`, categoryId);
      setValue(`items.${index}.serviceId`, '');
      setValue(`items.${index}.unitPrice`, 0);
    },
    [setValue],
  );

  const onService = useCallback(
    (index: number, serviceId: string) => {
      setValue(`items.${index}.serviceId`, serviceId);
      const s = byId.get(serviceId);
      if (s) {
        setValue(`items.${index}.unitPrice`, s.defaultPrice);
      }
    },
    [setValue, byId],
  );

  const m = useMutation({
    mutationFn: createPosOrder,
    onSuccess: () => {
      toast.success('Tạo đơn thành công.');
      reset({
        orderDate: toDateInputString(),
        customerPhone: '',
        customerName: '',
        salesChannelId: '',
        items: [{ categoryId: '', serviceId: '', sessions: 1, unitPrice: 0 }],
        discountType: 'VND',
        discountValue: 0,
        amountReceived: 0,
        notes: '',
      });
      void qc.invalidateQueries();
    },
  });

  const onValid = (v: PosFormValues) => {
    m.mutate({
      orderDate: v.orderDate,
      customer: { phone: v.customerPhone, name: v.customerName },
      salesChannelId: v.salesChannelId || undefined,
      items: v.items.map((i) => ({
        serviceId: i.serviceId,
        sessions: i.sessions,
        unitPrice: i.unitPrice,
      })),
      discountType: v.discountType,
      discountValue: v.discountValue,
      amountReceived: v.amountReceived,
      notes: v.notes,
    });
  };

  return (
    <form className="mx-auto max-w-4xl space-y-6" onSubmit={handleSubmit(onValid)} noValidate>
      <h1 className="text-2xl font-bold text-slate-900">Bán hàng (POS)</h1>

      {m.isError && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
          {m.error instanceof Error ? m.error.message : 'Không tạo được đơn'}
        </p>
      )}

      {catQ.isError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Không tải danh sách dịch vụ. Kiểm tra backend và tải lại trang.
        </p>
      )}

      <section className="card p-4">
        <h2 className="section-title mb-3">1. Thông tin khách hàng</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="orderDate">
              Ngày tạo đơn
            </label>
            <input id="orderDate" className="input" type="date" {...register('orderDate')} />
            {errors.orderDate && <p className="mt-1 text-xs text-rose-600">{errors.orderDate.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="ch">
              Kênh bán
            </label>
            <select id="ch" className="input" {...register('salesChannelId')} disabled={chQ.isLoading}>
              <option value="">-- Chọn Kênh --</option>
              {posChannelOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="phone">
              SĐT khách <span className="text-rose-500">*</span>
            </label>
            <Controller
              name="customerPhone"
              control={control}
              render={({ field }) => (
                <CustomerPhoneCombobox
                  id="phone"
                  value={field.value}
                  onChange={field.onChange}
                  onSelectCustomer={(c) =>
                    setValue('customerName', c.name, { shouldValidate: true, shouldDirty: true })
                  }
                  placeholder="Gõ SĐT — chọn khách cũ nếu có"
                  disabled={m.isPending}
                />
              )}
            />
            {errors.customerPhone && (
              <p className="mt-1 text-xs text-rose-600">{errors.customerPhone.message}</p>
            )}
          </div>
          <div>
            <label className="label" htmlFor="cname">
              Tên khách hàng <span className="text-rose-500">*</span>
            </label>
            <input
              id="cname"
              className="input"
              placeholder="Tên khách"
              {...register('customerName')}
            />
            {errors.customerName && (
              <p className="mt-1 text-xs text-rose-600">{errors.customerName.message}</p>
            )}
          </div>
        </div>
      </section>

      <section className="card p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="section-title">2. Chi tiết dịch vụ</h2>
          <button
            type="button"
            className="btn-primary w-full max-w-xs sm:w-auto"
            onClick={() => append({ categoryId: '', serviceId: '', sessions: 1, unitPrice: 0 })}
          >
            <Plus className="h-4 w-4" aria-hidden />
            THÊM DỊCH VỤ
          </button>
        </div>
        {errors.items?.root && (
          <p className="mb-2 text-sm text-rose-600">{errors.items.root.message}</p>
        )}
        <ul className="space-y-4">
          {fields.map((f, i) => (
            <li key={f.id} className="relative rounded-lg border border-slate-200 bg-brand-50/30 p-4 pr-2">
              <div className="mb-2 flex justify-end sm:absolute sm:right-3 sm:top-3">
                <button
                  type="button"
                  className="btn-danger-ghost py-1 text-xs"
                  onClick={() => remove(i)}
                  disabled={fields.length <= 1}
                  aria-label="Xóa dịch vụ"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xóa
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Loại dịch vụ</label>
                  <Controller
                    name={`items.${i}.categoryId` as const}
                    control={control}
                    render={({ field }) => (
                      <select
                        className="input"
                        value={field.value}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v);
                          onCategory(i, v);
                        }}
                        disabled={catQ.isLoading}
                      >
                        <option value="">-- Chọn --</option>
                        {(catQ.data ?? []).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.items?.[i]?.categoryId && (
                    <p className="mt-1 text-xs text-rose-600">{errors.items[i]?.categoryId?.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Chi tiết</label>
                  <Controller
                    name={`items.${i}.serviceId` as const}
                    control={control}
                    render={({ field }) => {
                      const catId = itemsWatch?.[i]?.categoryId ?? '';
                      const list = (catId && byCategory.get(catId)) || [];
                      return (
                        <select
                          className="input"
                          value={field.value}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(v);
                            onService(i, v);
                          }}
                        >
                          <option value="">-- Chọn dịch vụ --</option>
                          {list.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      );
                    }}
                  />
                  {errors.items?.[i]?.serviceId && (
                    <p className="mt-1 text-xs text-rose-600">{errors.items[i]?.serviceId?.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Số buổi liệu trình</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    {...register(`items.${i}.sessions` as const, { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <label className="label">Giá 1 buổi (VNĐ)</label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    {...register(`items.${i}.unitPrice` as const, { valueAsNumber: true })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-slate-600">
                    Thành tiền:{' '}
                    <span className="font-medium text-slate-900">
                      {formatVnd(
                        Math.max(0, (itemsWatch?.[i]?.unitPrice ?? 0) * (itemsWatch?.[i]?.sessions ?? 0)),
                      )}{' '}
                      VNĐ
                    </span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="card space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <span className="text-sm text-slate-500">Tổng tiền hàng</span>
            <p className="text-lg font-semibold tabular-nums">{formatVnd(subtotal)}</p>
          </div>
          <div>
            <label className="label" htmlFor="dval">
              Giảm giá đơn
            </label>
            <div className="flex gap-2">
              <input
                id="dval"
                className="input"
                type="number"
                min={0}
                inputMode="numeric"
                {...register('discountValue', { valueAsNumber: true })}
              />
              <select
                className="input w-32 flex-shrink-0"
                title="Loại giảm giá"
                {...register('discountType')}
              >
                <option value="VND">VNĐ</option>
                <option value="PERCENT">%</option>
              </select>
            </div>
            {errors.discountValue && (
              <p className="mt-1 text-xs text-rose-600">{errors.discountValue.message}</p>
            )}
          </div>
          <div>
            <span className="text-sm font-medium text-rose-600">CẦN THU</span>
            <p className="text-lg font-bold tabular-nums text-rose-700">{formatVnd(amountDue)}</p>
          </div>
          <div>
            <label className="label" htmlFor="ar">
              <span className="text-emerald-700">THỰC THU</span>
            </label>
            <input
              id="ar"
              className="input"
              type="number"
              min={0}
              inputMode="numeric"
              {...register('amountReceived', { valueAsNumber: true })}
            />
          </div>
        </div>
        <div
          className={cn('flex items-center justify-between rounded-lg px-2 py-2', 'bg-rose-50/80')}
        >
          <span className="text-sm font-semibold text-rose-700">CÒN NỢ</span>
          <span className="text-xl font-bold text-rose-800 tabular-nums">{formatVnd(remain)} VNĐ</span>
        </div>
        <div>
          <label className="label" htmlFor="notes">
            Ghi chú đơn hàng
          </label>
          <input
            id="notes"
            className="input"
            placeholder="Ghi chú đơn hàng..."
            {...register('notes')}
          />
        </div>
        <div className="pt-2">
          <button type="submit" className="btn-primary w-full sm:w-48" disabled={m.isPending || catQ.isError}>
            {m.isPending ? 'Đang lưu…' : 'Lưu hóa đơn'}
          </button>
        </div>
      </div>
    </form>
  );
}
