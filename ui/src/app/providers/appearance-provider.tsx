import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, createContext, useContext, useLayoutEffect } from 'react';
import { key } from '@/shared/api/query-keys';
import { fetchAppearanceConfig, type AppearanceConfig } from '@/shared/api/modules/appearance';
import { applyAppearanceToRoot, defaultAppearance } from '@/shared/theme/appearance';

type Ctx = {
  config: AppearanceConfig;
  isLoading: boolean;
  /** Refetch từ server (sau khi lưu) */
  refresh: () => Promise<unknown>;
};

const AppearanceContext = createContext<Ctx | null>(null);

export function useAppearance() {
  const v = useContext(AppearanceContext);
  if (!v) {
    throw new Error('useAppearance outside AppearanceProvider');
  }
  return v;
}

type Props = { children: ReactNode };

export function AppearanceProvider({ children }: Props) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: key.appearance(),
    queryFn: fetchAppearanceConfig,
    staleTime: 2 * 60_000,
  });

  useLayoutEffect(() => {
    applyAppearanceToRoot(defaultAppearance);
  }, []);

  useLayoutEffect(() => {
    if (q.data) {
      applyAppearanceToRoot(q.data);
    }
  }, [q.data]);

  const value: Ctx = {
    config: q.data ?? defaultAppearance,
    isLoading: q.isLoading,
    refresh: () => qc.invalidateQueries({ queryKey: key.appearance() }),
  };

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

/** Dùng trong AppShell nếu không cần throw (SSR-safe). */
export function useMaybeAppearance(): Ctx | null {
  return useContext(AppearanceContext);
}
