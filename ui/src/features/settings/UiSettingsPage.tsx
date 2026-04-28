import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette, Save, Sparkles, Type } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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

function ColorRow({
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
  const picker =
    value.length === 7 || value.length === 9 ? value.slice(0, 7) : '#000000';

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium" style={{ color: 'var(--app-text, #0f172a)' }}>
        {label}
      </span>
      {hint && <p className="text-xs text-slate-500/90 leading-snug">{hint}</p>}
      <div
        className={cn(
          'flex max-w-md overflow-hidden rounded-xl border bg-white/90 shadow-sm transition',
          'border-slate-200/90 focus-within:border-sky-300/80 focus-within:ring-2',
          'focus-within:ring-sky-500/20',
        )}
        style={{ borderColor: 'color-mix(in srgb, var(--app-border, #e2e8f0) 85%, #94a3b8)' }}
      >
        <div className="relative h-11 w-12 flex-shrink-0 border-r border-slate-200/80">
          <input
            type="color"
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            value={picker}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
            title="Chọn màu"
          />
          <div
            className="pointer-events-none h-full w-full"
            style={{ backgroundColor: picker }}
          />
        </div>
        <input
          className="min-w-0 flex-1 border-0 bg-transparent px-3 font-mono text-sm outline-none"
          style={{ color: 'var(--app-text, #0f172a)' }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB hoặc #RRGGBBAA"
        />
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  children,
  description,
}: {
  icon: typeof Sparkles;
  children: string;
  description?: string;
}) {
  return (
    <div className="mb-4 sm:mb-5">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{
            background: 'color-mix(in srgb, var(--app-button-bg) 12%, #fff)',
            color: 'var(--app-button-bg, #0284c7)',
          }}
        >
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--app-title, #0f172a)' }}>
            {children}
          </h2>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
      </div>
    </div>
  );
}

export function UiSettingsPage() {
  const { config, isLoading } = useAppearance();
  const qc = useQueryClient();
  const [form, setForm] = useState<AppearanceConfig | null>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setForm({ ...config });
  }, [config]);

  const save = useMutation({
    mutationFn: (body: AppearanceConfig) => saveAppearanceConfig(body),
    onSuccess: (data) => {
      applyAppearanceToRoot(data);
      void qc.setQueryData(key.appearance(), data);
      toast.success('Đã lưu cấu hình giao diện');
    },
    onError: (e: Error) => {
      toast.error(e?.message || 'Lỗi lưu');
    },
  });

  if (!form) {
    return <p className="text-slate-500">Đang tải cấu hình…</p>;
  }

  const setK = <K extends keyof AppearanceConfig>(k: K, v: AppearanceConfig[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-0 pb-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.65rem]" style={{ color: 'var(--app-title)' }}>
          Cài đặt chung & giao diện
        </h1>
        <p className="max-w-xl text-sm text-slate-500 leading-relaxed">
          Tùy chỉnh tên, logo, hiệu ứng nền Galaxy và bảng màu. Thay đổi sẽ áp dụng toàn ứng dụng sau khi lưu.
        </p>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Đang đồng bộ…</p>}

      <div
        className="overflow-hidden rounded-2xl border shadow-md"
        style={{
          background: 'var(--app-form-bg, rgba(255,255,255,0.92))',
          borderColor: 'color-mix(in srgb, var(--app-border) 70%, transparent)',
        }}
      >
        <div className="space-y-0">
          <section className="border-b border-slate-200/60 px-5 py-6 sm:px-8 sm:py-7">
            <SectionTitle icon={Type} description="Tên thương hiệu và biểu tượng bên trên menu.">
              Thông tin chung
            </SectionTitle>
            <div className="mt-0 space-y-4">
              <div className="max-w-lg">
                <label className="label" htmlFor="ui-brand">
                  Tên spa / thương hiệu
                </label>
                <input
                  id="ui-brand"
                  className="input"
                  value={form.brandName}
                  onChange={(e) => setK('brandName', e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="ui-logo">
                  Logo (link ảnh URL)
                </label>
                <input
                  id="ui-logo"
                  className="input max-w-2xl font-mono text-xs sm:text-sm"
                  value={form.logoUrl}
                  onChange={(e) => {
                    setLogoError(false);
                    setK('logoUrl', e.target.value);
                  }}
                  placeholder="https://…"
                />
                {form.logoUrl.trim() && /^https?:\/\//i.test(form.logoUrl) && !logoError && (
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-xs text-slate-500">Xem trước</span>
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/80 p-1.5">
                      <img
                        src={form.logoUrl}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                        onError={() => setLogoError(true)}
                      />
                    </div>
                  </div>
                )}
                {form.logoUrl.trim() && !/^https?:\/\//i.test(form.logoUrl) && (
                  <p className="mt-2 text-xs text-amber-700/90">Dùng URL bắt đầu bằng http:// hoặc https://</p>
                )}
              </div>
            </div>
          </section>

          <section className="border-b border-slate-200/60 bg-slate-50/30 px-5 py-6 sm:px-8 sm:py-7">
            <SectionTitle
              icon={Sparkles}
              description="Nền động trộn màu từ cài đặt bên dưới."
            >
              Hiệu ứng nền Galaxy
            </SectionTitle>
            <div className="max-w-md space-y-3">
              <div>
                <label className="label" htmlFor="ui-galaxy">
                  Chế độ
                </label>
                <select
                  id="ui-galaxy"
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
              </div>
              <p className="rounded-lg border border-slate-200/60 bg-white/60 px-3.5 py-2.5 text-xs text-slate-600 leading-relaxed">
                Khi bật, hệ thống trộn <strong className="font-medium text-slate-700">màu nền web</strong> với{' '}
                <strong className="font-medium text-slate-700">màu nút (brand)</strong> để tạo nền động. Ô nền khung
                form dùng mã <code className="rounded bg-slate-100/90 px-1.5 py-0.5 font-mono">#RRGGBBAA</code> sẽ
                tạo hiệu ứng trong suốt đẹp hơn.
              </p>
            </div>
          </section>

          <section className="px-5 py-6 sm:px-8 sm:py-7">
            <SectionTitle
              icon={Palette}
              description="Map trực tiếp tới biến CSS; có thể nhập 6 hoặc 8 ký tự hex."
            >
              Bảng màu
            </SectionTitle>
            <div className="space-y-8">
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Trang & nội dung
                </h3>
                <div className="grid gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-5">
                  <ColorRow label="Màu nền web / Galaxy" value={form.webBgColor} onChange={(v) => setK('webBgColor', v)} />
                  <ColorRow label="Chữ tổng thể" value={form.textColor} onChange={(v) => setK('textColor', v)} />
                  <div className="sm:col-span-2">
                    <ColorRow
                      label="Nền khung form (có thể 8 số #RRGGBBAA)"
                      value={form.formFrameBg}
                      onChange={(v) => setK('formFrameBg', v)}
                      hint="Hai số cuối (ví dụ cc) = độ mờ nền card."
                    />
                  </div>
                  <ColorRow
                    label="Chữ tiêu đề (h1, tiêu đề trang)"
                    value={form.titleTextColor}
                    onChange={(v) => setK('titleTextColor', v)}
                  />
                </div>
              </div>

              <div className="h-px bg-slate-200/60" aria-hidden />

              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Menu bên trái</h3>
                <div className="grid gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-5">
                  <ColorRow label="Nền menu" value={form.menuBgColor} onChange={(v) => setK('menuBgColor', v)} />
                  <ColorRow
                    label="Chữ tên thương hiệu trên menu"
                    value={form.menuTitleColor}
                    onChange={(v) => setK('menuTitleColor', v)}
                  />
                </div>
              </div>

              <div className="h-px bg-slate-200/60" aria-hidden />

              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Nút & viền</h3>
                <div className="grid gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-5">
                  <ColorRow label="Nền nút bấm (brand)" value={form.buttonBgColor} onChange={(v) => setK('buttonBgColor', v)} />
                  <ColorRow label="Chữ trên nút" value={form.buttonTextColor} onChange={(v) => setK('buttonTextColor', v)} />
                  <div className="sm:col-span-2">
                    <ColorRow
                      label="Màu viền (border, khung input)"
                      value={form.borderColor}
                      onChange={(v) => setK('borderColor', v)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-slate-200/60 bg-slate-50/25 px-5 py-4 sm:px-8 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="order-2 text-xs text-slate-500 sm:order-1 sm:max-w-md">
                Lưu sẽ cập nhật toàn ứng dụng. Làm mới trang nếu cần xem lại biểu tượng từ cache trình duyệt.
              </p>
              <button
                type="button"
                className="order-1 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-md transition enabled:hover:brightness-[0.97] enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:order-2 sm:w-auto"
                style={{
                  backgroundColor: 'var(--app-button-bg)',
                  color: 'var(--app-button-fg)',
                }}
                disabled={save.isPending}
                onClick={() => save.mutate(form)}
              >
                <Save className="h-4 w-4" />
                {save.isPending ? 'Đang lưu…' : 'Lưu cấu hình'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
