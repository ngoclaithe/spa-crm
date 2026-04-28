import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { key } from '@/shared/api/query-keys';
import { fetchCustomersList } from '@/shared/api/modules/customers';
import type { Customer } from '@/shared/api/types/schema';
import { cn } from '@/shared/lib/cn';

const DEBOUNCE_MS = 280;

type Props = {
  id?: string;
  value: string;
  onChange: (phone: string) => void;
  onSelectCustomer?: (c: Customer) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

/**
 * Ô SĐT + gợi ý khách có trong hệ thống (gõ ≥2 ký tự).
 */
export function CustomerPhoneCombobox({
  id: _id,
  value,
  onChange,
  onSelectCustomer,
  disabled,
  placeholder = 'Nhập số điện thoại',
  className,
}: Props) {
  const genId = useId();
  const listboxId = `${genId}-listbox`;
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [hl, setHl] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const blurT = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value]);

  const canSearch = debounced.length >= 2;
  const q = useQuery({
    queryKey: key.customersSearch(debounced),
    queryFn: () => fetchCustomersList({ q: debounced, limit: 20 }),
    enabled: canSearch && !disabled,
    staleTime: 20_000,
  });

  const list = (q.data ?? []) as Customer[];

  useEffect(() => {
    setHl(0);
  }, [debounced, list.length]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = useCallback(
    (c: Customer) => {
      onChange(c.phone);
      onSelectCustomer?.(c);
      setOpen(false);
    },
    [onChange, onSelectCustomer],
  );

  const onFocus = () => {
    if (blurT.current) {
      clearTimeout(blurT.current);
    }
    if (canSearch && (q.isFetching || list.length > 0)) {
      setOpen(true);
    }
  };

  const onBlurInput = () => {
    blurT.current = setTimeout(() => setOpen(false), 180);
  };

  const hasPanel = canSearch && (q.isFetching || list.length > 0);
  const show = open && hasPanel;

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <input
        id={_id}
        type="text"
        className="input w-full"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          const t = e.target.value.trim();
          if (t.length >= 2) {
            setOpen(true);
          } else {
            setOpen(false);
          }
        }}
        onFocus={onFocus}
        onBlur={onBlurInput}
        onKeyDown={(e) => {
          if (!show) {
            return;
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHl((h) => Math.min(h + 1, list.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHl((h) => Math.max(h - 1, 0));
          } else if (e.key === 'Enter' && list[hl]) {
            e.preventDefault();
            pick(list[hl]!);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        inputMode="tel"
        autoComplete="off"
        disabled={disabled}
        role="combobox"
        aria-expanded={hasPanel && open}
        aria-controls={show ? listboxId : undefined}
        aria-autocomplete="list"
      />
      {show && (
        <ul
          id={listboxId}
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-left text-sm shadow-lg"
          role="listbox"
        >
          {q.isFetching && <li className="px-3 py-2 text-slate-500">Đang tìm…</li>}
          {!q.isFetching &&
            list.map((c, i) => (
              <li
                key={c.id}
                role="option"
                aria-selected={i === hl}
                className={cn(
                  'cursor-pointer px-3 py-2',
                  i === hl ? 'bg-sky-100' : 'hover:bg-slate-50',
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(c)}
              >
                <span className="font-mono tabular-nums text-slate-900">{c.phone}</span>
                <span className="ml-2 text-slate-600">{c.name}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
