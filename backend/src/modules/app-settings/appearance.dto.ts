import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const GALAXY_MODES = ['off', 'custom'] as const;
export type GalaxyMode = (typeof GALAXY_MODES)[number];

export const DEFAULT_APPEARANCE = {
  brandName: 'Pyna Spa',
  logoUrl: '',
  galaxyMode: 'custom' as GalaxyMode,
  webBgColor: '#1e3a5f',
  textColor: '#0f172a',
  menuBgColor: '#f8fafc',
  menuTitleColor: '#0f172a',
  formFrameBg: '#ffffffcc',
  titleTextColor: '#0f172a',
  buttonBgColor: '#0284c7',
  buttonTextColor: '#ffffff',
  borderColor: '#e2e8f0',
} as const;

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

const HEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

export class UpdateAppearanceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brandName?: string;

  @ApiPropertyOptional({ description: 'URL ảnh logo' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  logoUrl?: string;

  @ApiPropertyOptional({ enum: GALAXY_MODES })
  @IsOptional()
  @IsIn(GALAXY_MODES)
  galaxyMode?: GalaxyMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(HEX, { message: 'Màu phải dạng #RGB, #RRGGBB hoặc #RRGGBBAA' })
  webBgColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(HEX)
  textColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(HEX)
  menuBgColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(HEX)
  menuTitleColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(HEX)
  formFrameBg?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(HEX)
  titleTextColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(HEX)
  buttonBgColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(HEX)
  buttonTextColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(HEX)
  borderColor?: string;
}
