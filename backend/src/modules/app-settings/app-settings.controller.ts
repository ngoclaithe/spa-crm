import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { AppSettingsService } from './app-settings.service';
import { UpdateAppearanceDto } from './appearance.dto';

class UpsertSettingDto {
  @IsString()
  @MinLength(1)
  value: string;
}

@ApiTags('Cấu hình giao diện (App settings)')
@Controller('app-settings')
export class AppSettingsController {
  constructor(private readonly service: AppSettingsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get('appearance')
  getAppearance() {
    return this.service.getAppearanceConfig();
  }

  @Put('appearance')
  putAppearance(@Body() body: UpdateAppearanceDto) {
    return this.service.saveAppearanceConfig(body);
  }

  @Post('kv')
  putByBody(@Body() body: { key: string; value: string }) {
    return this.service.upsert(body.key, body.value);
  }

  @Get(':key')
  getOne(@Param('key') key: string) {
    return this.service.getByKey(key);
  }

  @Put(':key')
  put(
    @Param('key') key: string,
    @Body() body: UpsertSettingDto,
  ) {
    return this.service.upsert(key, body.value);
  }

  @Delete(':key')
  del(@Param('key') key: string) {
    return this.service.delete(key);
  }
}
