import { type ReactNode } from 'react';

type Props = { title: string; description: string; children?: ReactNode };

/**
 * Màn hình chưa xây xong: giữ layout & copy rõ ràng, tránh 404.
 */
export function PagePlaceholder({ title, description, children }: Props) {
  return (
    <div className="card max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {children ? <div className="mt-4 border-t border-slate-100 pt-4">{children}</div> : null}
    </div>
  );
}
