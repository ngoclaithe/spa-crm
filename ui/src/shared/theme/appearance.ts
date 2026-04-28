import type { AppearanceConfig } from '@/shared/api/modules/appearance';

/** Cấu hình mặc định (khớp backend) — dùng trước khi API trả về. */
export const defaultAppearance: AppearanceConfig = {
  brandName: 'Pyna Spa',
  logoUrl: '',
  galaxyMode: 'custom',
  webBgColor: '#1e3a5f',
  textColor: '#0f172a',
  menuBgColor: '#f8fafc',
  menuTitleColor: '#0f172a',
  formFrameBg: '#ffffffcc',
  titleTextColor: '#0f172a',
  buttonBgColor: '#0284c7',
  buttonTextColor: '#ffffff',
  borderColor: '#e2e8f0',
};

export function applyAppearanceToRoot(c: AppearanceConfig) {
  const r = document.documentElement;
  r.style.setProperty('--app-web-bg', c.webBgColor);
  r.style.setProperty('--app-text', c.textColor);
  r.style.setProperty('--app-menu-bg', c.menuBgColor);
  r.style.setProperty('--app-menu-title', c.menuTitleColor);
  r.style.setProperty('--app-form-bg', c.formFrameBg);
  r.style.setProperty('--app-title', c.titleTextColor);
  r.style.setProperty('--app-button-bg', c.buttonBgColor);
  r.style.setProperty('--app-button-fg', c.buttonTextColor);
  r.style.setProperty('--app-border', c.borderColor);
  r.setAttribute('data-galaxy', c.galaxyMode);
  document.body.classList.add('app-themed');
}
