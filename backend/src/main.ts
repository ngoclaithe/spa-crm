import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/** CORS: FRONTEND_URL trong .env, nhiều nguồn cách bằng dấu phẩy. Bỏ trống = phản ánh Origin (giống origin: true, tiện local). */
function getCorsOrigin(): boolean | string | string[] {
  const raw = process.env.FRONTEND_URL?.trim();
  if (!raw) {
    return true;
  }
  const list = raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (list.length === 0) {
    return true;
  }
  if (list.length === 1) {
    return list[0]!;
  }
  return list;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const corsOrigins = getCorsOrigin();
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('PYNA SPA miniCRM')
    .setDescription('API POS, công nợ, danh mục dịch vụ, nhật ký giao dịch')
    .setVersion('1.0.0')
    .addServer('/')
    .build();
  const document = SwaggerModule.createDocument(app, config, { operationIdFactory: (c, m) => m });
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  const corsInfo =
    typeof corsOrigins === 'boolean' ? 'FRONTEND_URL=∅ (mọi Origin khi bật reflect)' : JSON.stringify(corsOrigins);
  // eslint-disable-next-line no-console
  console.log(
    `API: http://localhost:${port}/api  Swagger: http://localhost:${port}/api/docs  CORS: ${corsInfo}`,
  );
}
bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
