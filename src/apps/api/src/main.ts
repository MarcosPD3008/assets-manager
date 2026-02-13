/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { types as pgTypes } from 'pg';
import { AppModule } from './app/app.module';

// Normalize PostgreSQL timestamp without timezone (OID 1114) as UTC.
pgTypes.setTypeParser(1114, (value: string) => {
  const normalized = value.replace(' ', 'T');
  return new Date(`${normalized}Z`);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.enableShutdownHooks();

  const corsOrigin = process.env['CORS_ORIGIN'];
  app.enableCors({
    origin: corsOrigin
      ? corsOrigin
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean)
      : true,
    credentials: true,
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Assets Manager API')
    .setDescription('API documentation for Assets Manager system')
    .setVersion('1.0')
    .addTag('Assets', 'Asset management endpoints')
    .addTag('Contacts', 'Contact management endpoints')
    .addTag('Assignments', 'Assignment management endpoints')
    .addTag('Maintenances', 'Maintenance scheduling endpoints')
    .addTag('Reminders', 'Reminder management endpoints')
    .addTag('Reminder Rules', 'Relative reminder rule endpoints')
    .addTag('Notification Deliveries', 'Notification delivery and retry endpoints')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env['PORT'] ?? 3000);
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(
    `📚 Swagger documentation available at: http://localhost:${port}/${globalPrefix}/docs`,
  );
}

bootstrap();
