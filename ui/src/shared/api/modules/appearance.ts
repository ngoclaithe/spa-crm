import { http } from '../client';

export const galaxyModeValues = ['off', 'custom'] as const;
export type GalaxyMode = (typeof galaxyModeValues)[number];

export type AppearanceConfig = {
  brandName: string;
  logoUrl: string;
  galaxyMode: GalaxyMode;
  webBgColor: string;
  textColor: string;
  menuBgColor: string;
  menuTitleColor: string;
  formFrameBg: string;
  titleTextColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  borderColor: string;
};

export async function fetchAppearanceConfig() {
  const { data } = await http.get<AppearanceConfig>('/app-settings/appearance');
  return data;
}

export async function saveAppearanceConfig(config: AppearanceConfig) {
  const { data } = await http.put<AppearanceConfig>('/app-settings/appearance', config);
  return data;
}
