import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  createService,
  createServiceCategory,
  fetchServiceCategoriesAdmin,
  patchService,
  patchServiceCategory,
} from '@/shared/api/modules/catalog';
import { key } from '@/shared/api/query-keys';
import type { ServiceCategory } from '@/shared/api/types/schema';
import { formatVnd } from '@/shared/lib/money';

type FlatRow = {
  serviceId: string;
  categoryId: string;
  categoryName: string;
  serviceName: string;
  defaultPrice: number;
  active: boolean;
};

function flattenCategories(cats: ServiceCategory[] | undefined): FlatRow[] {
  if (!cats?.length) {
    return [];
  }
  const rows: FlatRow[] = [];
  for (const c of cats) {
    const list = [...(c.services ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    for (const s of list) {
      rows.push({
        serviceId: s.id,
        categoryId: c.id,
        categoryName: c.name,
        serviceName: s.name,
        defaultPrice: s.defaultPrice,
        active: s.active,
      });
    }
  }
  return rows;
}

function findCategoryByName(cats: ServiceCategory[], name: string) {
  const n = name.trim().toLowerCase();
  return cats.find((c) => c.name.trim().toLowerCase() === n);
}

function parsePriceInput(raw: string) {
  const digits = String(raw).replace(/\D/g, '');
  return Math.max(0, Math.floor(parseInt(digits, 10) || 0));
}

export function CatalogPage() {
  const qc = useQueryClient();
  const [newCategory, setNewCategory] = useState('');
  const [newDetail, setNewDetail] = useState('');
  const [newPrice, setNewPrice] = useState('0');
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [eCategory, setECategory] = useState('');
  const [eName, setEName] = useState('');
  const [ePrice, setEPrice] = useState('0');

  const q = useQuery({
    queryKey: key.serviceCategoriesAdmin(),
    queryFn: fetchServiceCategoriesAdmin,
  });

  const rows = useMemo(() => flattenCategories(q.data), [q.data]);

  const addMutation = useMutation({
    onMutate: () => {
      setFormError(null);
    },
    mutationFn: async () => {
      const catName = newCategory.trim();
      const detName = newDetail.trim();
      if (!catName || !detName) {
        throw new Error('Nhập đủ loại dịch vụ và chi tiết.');
      }
      const price = parsePriceInput(newPrice);
      const cats = q.data ?? [];
      let category = findCategoryByName(cats, catName);
      if (!category) {
        const maxSort = cats.reduce((m, c) => Math.max(m, c.sortOrder), -1);
        category = await createServiceCategory({
          name: catName,
          sortOrder: maxSort + 1,
        });
      }
      await createService({
        categoryId: category.id,
        name: detName,
        defaultPrice: price,
        active: true,
      });
    },
    onSuccess: () => {
      setFormError(null);
      setNewCategory('');
      setNewDetail('');
      setNewPrice('0');
      void qc.invalidateQueries({ queryKey: key.catalog() });
    },
    onError: (e: unknown) => {
      setFormError(e instanceof Error ? e.message : 'Lỗi thêm');
    },
  });

  const hideMutation = useMutation({
    mutationFn: (serviceId: string) => patchService(serviceId, { active: false }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key.catalog() });
    },
  });

  const startEdit = (r: FlatRow) => {
    setEditingId(r.serviceId);
    setECategory(r.categoryName);
    setEName(r.serviceName);
    setEPrice(String(r.defaultPrice));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveMutation = useMutation({
    mutationFn: async (r: FlatRow) => {
      const cat = eCategory.trim();
      const name = eName.trim();
      if (!cat || !name) {
        throw new Error('Nhập đủ loại dịch vụ và chi tiết.');
      }
      const price = parsePriceInput(ePrice);
      const catChanged = cat !== r.categoryName;
      const svcChanged = name !== r.serviceName || price !== r.defaultPrice;
      if (!catChanged && !svcChanged) {
        return { didUpdate: false } as const;
      }
      if (catChanged) {
        await patchServiceCategory(r.categoryId, { name: cat });
      }
      if (svcChanged) {
        await patchService(r.serviceId, { name, defaultPrice: price });
      }
      return { didUpdate: true } as const;
    },
    onSuccess: (res) => {
      if (res?.didUpdate) {
        toast.success('Đã cập nhật dịch vụ.');
      }
      setEditingId(null);
      void qc.invalidateQueries({ queryKey: key.catalog() });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : 'Không lưu được');
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Quản lý danh mục</h1>

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-brand-200 bg-brand-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-brand-800">Thêm vào sổ</h2>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div className="sm:col-span-1">
            <label className="label" htmlFor="cat-new">
              Loại dịch vụ mới
            </label>
            <input
              id="cat-new"
              className="input"
              placeholder="VD: Triệt Lông"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              disabled={addMutation.isPending}
            />
          </div>
          <div className="sm:col-span-1">
            <label className="label" htmlFor="det-new">
              Chi tiết dịch vụ
            </label>
            <input
              id="det-new"
              className="input"
              placeholder="VD: Triệt nách"
              value={newDetail}
              onChange={(e) => setNewDetail(e.target.value)}
              disabled={addMutation.isPending}
            />
          </div>
          <div>
            <label className="label" htmlFor="price-new">
              Giá mặc định (VNĐ)
            </label>
            <input
              id="price-new"
              className="input"
              inputMode="numeric"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              disabled={addMutation.isPending}
            />
          </div>
          <div>
            <button
              type="button"
              className="btn-primary h-[42px] w-full"
              disabled={addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending ? 'Đang thêm…' : '+ THÊM VÀO SỔ'}
            </button>
          </div>
        </div>
        {formError && (
          <p className="border-t border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-800" role="alert">
            {formError}
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Sổ dịch vụ</h2>
          <p className="mt-1 text-xs text-slate-500">
            Sửa tên loại áp dụng cho tất cả dịch vụ cùng loại. Sửa chi tiết &amp; giá chỉ dòng đang chọn.
          </p>
        </div>
        {q.isLoading && <p className="p-6 text-slate-500">Đang tải…</p>}
        {q.isError && (
          <p className="p-6 text-rose-600">Không tải được danh mục. Kiểm tra backend.</p>
        )}
        {q.data && rows.length === 0 && (
          <p className="p-6 text-slate-500">Chưa có dòng nào. Chạy seed hoặc thêm ở form trên.</p>
        )}
        {q.data && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Loại dịch vụ</th>
                  <th className="px-4 py-3">Chi tiết dịch vụ</th>
                  <th className="px-4 py-3 text-right">Giá</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isEditing = editingId === r.serviceId;
                  return (
                    <tr
                      key={r.serviceId}
                      className={`border-b border-slate-100 last:border-0 ${!r.active ? 'bg-slate-50 text-slate-400' : ''}`}
                    >
                      {isEditing ? (
                        <>
                          <td className="px-4 py-2">
                            <input
                              className="input text-sm"
                              value={eCategory}
                              onChange={(e) => setECategory(e.target.value)}
                              disabled={saveMutation.isPending}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              className="input text-sm"
                              value={eName}
                              onChange={(e) => setEName(e.target.value)}
                              disabled={saveMutation.isPending}
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <input
                              className="input text-right text-sm tabular-nums"
                              inputMode="numeric"
                              value={ePrice}
                              onChange={(e) => setEPrice(e.target.value)}
                              disabled={saveMutation.isPending}
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                className="rounded-md bg-slate-200 px-3 py-1 text-xs font-medium text-slate-800 hover:bg-slate-300"
                                disabled={saveMutation.isPending}
                                onClick={cancelEdit}
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                className="rounded-md bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                                disabled={saveMutation.isPending}
                                onClick={() => saveMutation.mutate(r)}
                              >
                                {saveMutation.isPending ? '…' : 'Lưu'}
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2.5 font-medium text-slate-800">{r.categoryName}</td>
                          <td className="px-4 py-2.5">
                            {r.serviceName}
                            {!r.active && (
                              <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">
                                Đã ẩn
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{formatVnd(r.defaultPrice)} đ</td>
                          <td className="px-4 py-2.5 text-right">
                            {r.active ? (
                              <div className="flex flex-wrap justify-end gap-2">
                                <button
                                  type="button"
                                  className="rounded-md border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800 hover:bg-sky-100 disabled:opacity-50"
                                  disabled={!!editingId && editingId !== r.serviceId}
                                  onClick={() => startEdit(r)}
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  className="rounded-md bg-rose-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
                                  disabled={hideMutation.isPending || editingId != null}
                                  onClick={() => {
                                    if (window.confirm(`Ẩn dịch vụ "${r.serviceName}"?`)) {
                                      hideMutation.mutate(r.serviceId);
                                    }
                                  }}
                                >
                                  Xóa
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
