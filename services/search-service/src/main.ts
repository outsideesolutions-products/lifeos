import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { JsonLoggerService } from './common/json-logger.service';

const SERVICE_NAME = 'search-service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new JsonLoggerService(SERVICE_NAME),
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const port = process.env.SEARCH_SERVICE_PORT ?? 4007;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      service: SERVICE_NAME,
      severity: 'info',
      message: `listening on port ${port}`,
    }),
  );
}

bootstrap();
