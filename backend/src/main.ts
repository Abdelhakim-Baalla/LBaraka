import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3000);

  app.enableCors();

  // Validation stricte des DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Gestion globale des erreurs
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(port, '0.0.0.0');
  console.log(`🟢 LBaraka API running on http://localhost:${port}`);
  console.log(`🔌 Socket.io disponible sur ws://localhost:${port}/chat`);
}
bootstrap();
