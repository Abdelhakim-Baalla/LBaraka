import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

// DTO pour le montant du portefeuille
export class WalletAmountDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  montant: number;
}
