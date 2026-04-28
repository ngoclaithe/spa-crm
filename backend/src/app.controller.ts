import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly app: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Kiểm tra API' })
  getHealth() {
    return this.app.health();
  }
}
