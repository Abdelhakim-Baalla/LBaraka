import { IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  receiverId: string;

  @IsNotEmpty()
  annonceId: string;

  @IsEnum(['TEXT', 'VOICE', 'IMAGE'])
  type: string = 'TEXT';

  @IsNotEmpty()
  content: string; // Not required for voice if sent as multipart
}
