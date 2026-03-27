import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @IsBoolean()
  @IsNotEmpty()
  isBlocked: boolean;
}
