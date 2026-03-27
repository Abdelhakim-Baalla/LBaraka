import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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

  // Configuration Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LBaraka API')
    .setDescription('API pour la plateforme LBaraka - Système de livraison entre particuliers')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Entrer votre token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Endpoints pour l\'authentification')
    .addTag('Utilisateurs', 'Gestion des profils utilisateurs')
    .addTag('Annonces', 'Gestion des annonces de livraison')
    .addTag('Transactions', 'Gestion des transactions financières')
    .addTag('Wallet', 'Gestion du portefeuille utilisateur')
    .addTag('Contrats', 'Gestion des contrats de livraison')
    .addTag('Point-Relais', 'Gestion des points relais')
    .addTag('Notifications', 'Gestion des notifications')
    .addTag('Chat', 'Messagerie instantanée')
    .addTag('Admin', 'Endpoints administration')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port, '0.0.0.0');
  console.log(`🟢 LBaraka API running on http://localhost:${port}`);
  console.log(`📚 Swagger disponible sur http://localhost:${port}/api/docs`);
  console.log(`🔌 Socket.io disponible sur ws://localhost:${port}/chat`);
}
bootstrap();
