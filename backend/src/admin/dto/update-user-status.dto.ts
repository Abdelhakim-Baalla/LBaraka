import { IsBoolean, IsNotEmpty } from 'class-validator';

// DTO pour bloquer ou débloquer un utilisateur
export class UpdateUserStatusDto {
  @IsBoolean()
  @IsNotEmpty()
  isBlocked: boolean;
}
