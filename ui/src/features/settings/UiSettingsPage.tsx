import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppearance } from '@/app/providers/appearance-provider';
import { key } from '@/shared/api/query-keys';
import {
  type AppearanceConfig,
  galaxyModeValues,
  saveAppearanceConfig,
} from '@/shared/api/modules/appearance';
import { applyAppearanceToRoot } from '@/shared/theme/appearance';
import { cn } from '@/shared/lib/cn';

const GALAXY_LABEL: Record<string, string> = {
  off: 'Tắt',
  custom: 'Bật Galaxy tùy chỉnh cá nhân',
};

function ColorField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {hint && <p className="mb-1 text-xs text-slate-500">{hint}</p>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="h-10 w-12 cursor-pointer rounded border p-0"
          style={{ borderColor: 'var(--app-border)' }}
          value={value.length === 7 || value.length === 9 ? value.slice(0, 7) : '#000000'}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          className="input font-mono text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB hoặc #RRGGBBAA"
        />
      </div>
    </div>
  );
}

export function UiSettingsPage() {
  const { config, isLoading } = useAppearance();
  const qc = useQueryClient();
  const [form, setForm] = useState<AppearanceConfig | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setForm({ ...config });
  }, [config]);

  const save = useMutation({
    mutationFn: (body: AppearanceConfig) => saveAppearanceConfig(body),
    onSuccess: (data) => {
      applyAppearanceToRoot(data);
      void qc.setQueryData(key.appearance(), data);
      setMsg('Đã lưu cấu hình giao diện.');
    },
    onError: (e: Error) => {
      setMsg(e.message ?? 'Lỗi lưu');
    },
  });

  if (!form) {
    return <p className="text-slate-500">Đang tải cấu hình…</p>;
  }

  const setK = <K extends keyof AppearanceConfig>(k: K, v: AppearanceConfig[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--app-title)' }}>
          Cài đặt chung & giao diện
        </h1>
        <p className="text-sm text-slate-500">Pyna Spa — tùy chỉnh màu, logo và hiệu ứng nền.</p>
      </div>

      {isLoading && <p className="text-slate-400">Đang đồng bộ…</p>}

      <div className="card space-y-5 p-5">
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase text-slate-600">Thông tin chung</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Tên spa / thương hiệu</label>
              <input
                className="input"
                value={form.brandName}
                onChange={(e) => setK('brandName', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Logo (icon hoặc link ảnh URL)</label>
              <input
                className="input"
                value={form.logoUrl}
                onChange={(e) => setK('logoUrl', e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200/80 pt-4">
          <h2 className="mb-3 text-sm font-bold uppercase text-slate-600">Hiệu ứng nền (Galaxy)</h2>
          <div>
            <label className="label">Hiệu ứng nền động (Galaxy mode)</label>
            <select
              className="input"
              value={form.galaxyMode}
              onChange={(e) => setK('galaxyMode', e.target.value as AppearanceConfig['galaxyMode'])}
            >
              {galaxyModeValues.map((g) => (
                <option key={g} value={g}>
                  {GALAXY_LABEL[g] ?? g}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Khi bật, hệ thống trộn màu <strong>nền web / Galaxy</strong> với <strong>màu nút (brand)</strong> để tạo
              nền động. Dùng mã <strong>HEX 8 số</strong> (ví dụ <code className="rounded bg-slate-100 px-1">#ffffffcc</code>
              ) ở ô nền khung form sẽ cho hiệu ứng alpha đẹp.
            </p>
          </div>
        </section>

        <section className="border-t border-slate-200/80 pt-4">
          <h2 className="mb-3 text-sm font-bold uppercase text-slate-600">Màu sắc chi tiết</h2>
          <div className="grid gap-4 sm:grid-cols-1">
            <ColorField
              label="Màu nền web / Galaxy"
              value={form.webBgColor}
              onChange={(v) => setK('webBgColor', v)}
            />
            <ColorField
              label="Chữ tổng thể"
              value={form.textColor}
              onChange={(v) => setK('textColor', v)}
            />
            <ColorField
              label="Nền menu trái"
              value={form.menuBgColor}
              onChange={(v) => setK('menuBgColor', v)}
            />
            <ColorField
              label="Chữ menu (tên spa ở sidebar)"
              value={form.menuTitleColor}
              onChange={(v) => setK('menuTitleColor', v)}
            />
            <div>
              <ColorField
                label="Nền khung form (HEX, có thể 8 số #RRGGBBAA)"
                value={form.formFrameBg}
                onChange={(v) => setK('formFrameBg', v)}
                hint="Trong số #8: độ mờ ~80% với tương ứng cc ở cuối."
              />
            </div>
            <ColorField
              label="Chữ tiêu đề (title)"
              value={form.titleTextColor}
              onChange={(v) => setK('titleTextColor', v)}
            />
            <ColorField
              label="Nền nút bấm (brand)"
              value={form.buttonBgColor}
              onChange={(v) => setK('buttonBgColor', v)}
            />
            <ColorField
              label="Chữ trên nút bấm"
              value={form.buttonTextColor}
              onChange={(v) => setK('buttonTextColor', v)}
            />
            <ColorField
              label="Màu đường viền (border)"
              value={form.borderColor}
              onChange={(v) => setK('borderColor', v)}
            />
          </div>
        </section>

        {msg && (
          <p
            className={cn(
              'rounded-lg px-3 py-2 text-sm',
              msg.startsWith('Đã lưu') ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800',
            )}
            role="status"
          >
            {msg}
          </p>
        )}

        <button
          type="button"
          className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-base font-semibold"
          disabled={save.isPending}
          onClick={() => {
            setMsg(null);
            save.mutate(form);
          }}
        >
          <Save className="h-5 w-5" />
          {save.isPending ? 'Đang lưu…' : 'ÁP DỤNG & LƯU CẤU HÌNH'}
        </button>
      </div>
    </div>
  );
}
