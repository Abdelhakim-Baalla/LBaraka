import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UtilisateurModule } from './utilisateur/utilisateur.module';
import { AnnonceModule } from './annonce/annonce.module';
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transaction/transaction.module';
import { ContratModule } from './contrat/contrat.module';
import { MongoModule } from './mongo/mongo.module';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notification/notification.module';
import { PointRelaisModule } from './point-relais/point-relais.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UtilisateurModule,
    AuthModule,
    AnnonceModule,
    WalletModule,
    TransactionModule,
    ContratModule,
    MongoModule,
    ChatModule,
    NotificationModule,
    PointRelaisModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
