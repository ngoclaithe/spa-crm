import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppearance } from '@/app/providers/appearance-provider';
import { cn } from '@/shared/lib/cn';
import { MAIN_NAV } from './sidebar-nav';

export function AppShell() {
  const { config } = useAppearance();
  const [logoErr, setLogoErr] = useState(false);
  const showLogo = config.logoUrl.trim() !== '' && !logoErr;
  useEffect(() => {
    setLogoErr(false);
  }, [config.logoUrl]);

  return (
    <div className="app-root-inner min-h-screen">
      {config.galaxyMode === 'custom' && <div className="app-galaxy-layer" aria-hidden />}
      <div className="relative z-10 flex min-h-screen">
        <aside
          className="flex w-64 flex-shrink-0 flex-col border-r shadow-sm"
          style={{
            backgroundColor: 'var(--app-menu-bg)',
            borderColor: 'var(--app-border)',
          }}
        >
          <div className="border-b p-4" style={{ borderColor: 'var(--app-border)' }}>
            <div className="flex min-h-[2.75rem] items-center gap-3">
              {showLogo && (
                <img
                  src={config.logoUrl}
                  alt=""
                  className="h-8 max-h-10 w-auto max-w-[5.5rem] flex-shrink-0 object-contain object-left sm:h-10 sm:max-w-[6.5rem]"
                  onError={() => setLogoErr(true)}
                />
              )}
              <h1
                className="min-w-0 flex-1 text-balance text-lg font-bold leading-snug tracking-tight"
                style={{ color: 'var(--app-menu-title)' }}
              >
                {config.brandName}
              </h1>
            </div>
          </div>
          <nav className="flex-1 space-y-0.5 p-2" style={{ color: 'var(--app-text)' }}>
            {MAIN_NAV.map((it, i) => (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) =>
                  cn(
                    'nav-pill flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? ''
                      : 'text-slate-600 hover:bg-black/[0.04] hover:text-slate-900',
                  )
                }
              >
                <span className="w-5 text-center text-xs font-semibold tabular-nums text-slate-400">
                  {i + 1}.
                </span>
                <it.icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} style={{ color: 'inherit' }} />
                {it.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main
          className="app-main-surface min-w-0 flex-1 p-4 text-[color:var(--app-text)] md:p-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
