import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { WalletModule } from '../wallet/wallet.module';
import { ContratModule } from '../contrat/contrat.module';
import { UtilisateurModule } from '../utilisateur/utilisateur.module';

@Module({
  imports: [WalletModule, ContratModule, UtilisateurModule],
  providers: [TransactionService],
  controllers: [TransactionController]
})
export class TransactionModule {}
