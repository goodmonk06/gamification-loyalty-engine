import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for admin UI
  app.enableCors({
    origin: ['http://localhost:3001', process.env.ADMIN_URL || '*'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Gamification & Loyalty Engine API')
    .setDescription('API for managing points, badges, levels, and loyalty tiers')
    .setVersion('1.0')
    .addTag('events', 'Event ingestion and processing')
    .addTag('users', 'User account management')
    .addTag('programs', 'Program configuration')
    .addTag('badges', 'Badge management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Gamification Engine running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
