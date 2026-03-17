import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3000);

  app.enableCors();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(port, '0.0.0.0');
  console.log(`🟢 LBaraka API running on http://localhost:${port}`);
}
bootstrap();
