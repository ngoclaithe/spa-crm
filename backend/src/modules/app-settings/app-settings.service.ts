import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_APPEARANCE,
  type AppearanceConfig,
  type UpdateAppearanceDto,
} from './appearance.dto';

const UI_APPEARANCE_KEY = 'ui.appearance';

@Injectable()
export class AppSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  getByKey(key: string) {
    return this.prisma.appSetting.findUnique({ where: { key } });
  }

  list() {
    return this.prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async upsert(key: string, value: string) {
    return this.prisma.appSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  async delete(key: string) {
    const found = await this.getByKey(key);
    if (!found) {
      throw new NotFoundException();
    }
    return this.prisma.appSetting.delete({ where: { key } });
  }

  private parseAppearanceFromDb(raw: string | null | undefined): AppearanceConfig {
    if (!raw?.trim()) {
      return { ...DEFAULT_APPEARANCE };
    }
    try {
      const o = JSON.parse(raw) as Partial<Record<keyof AppearanceConfig, string>>;
      const m: AppearanceConfig = { ...DEFAULT_APPEARANCE };
      (Object.keys(DEFAULT_APPEARANCE) as (keyof typeof DEFAULT_APPEARANCE)[]).forEach((k) => {
        if (k === 'galaxyMode') {
          if (o.galaxyMode === 'off' || o.galaxyMode === 'custom') {
            m.galaxyMode = o.galaxyMode;
          }
          return;
        }
        if (o[k] != null && typeof o[k] === 'string') {
          m[k] = o[k] as string;
        }
      });
      if (m.galaxyMode !== 'off' && m.galaxyMode !== 'custom') {
        m.galaxyMode = 'custom';
      }
      return m;
    } catch {
      return { ...DEFAULT_APPEARANCE };
    }
  }

  async getAppearanceConfig(): Promise<AppearanceConfig> {
    const row = await this.getByKey(UI_APPEARANCE_KEY);
    return this.parseAppearanceFromDb(row?.value);
  }

  async saveAppearanceConfig(dto: UpdateAppearanceDto): Promise<AppearanceConfig> {
    const current = await this.getAppearanceConfig();
    const next: AppearanceConfig = { ...current, ...dto };
    if (next.galaxyMode !== 'off' && next.galaxyMode !== 'custom') {
      next.galaxyMode = 'custom';
    }
    await this.upsert(UI_APPEARANCE_KEY, JSON.stringify(next));
    return next;
  }
}
