import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { WalletModule } from '../wallet/wallet.module';
import { ContratModule } from '../contrat/contrat.module';
import { UtilisateurModule } from '../utilisateur/utilisateur.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    WalletModule,
    ContratModule,
    UtilisateurModule,
    StorageModule,
    JwtModule.register({}),
  ],
  providers: [TransactionService],
  controllers: [TransactionController]
})
export class TransactionModule { }
