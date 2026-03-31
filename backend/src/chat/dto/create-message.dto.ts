import { IsNotEmpty, IsEnum } from 'class-validator';

// DTO pour créer un message
export class CreateMessageDto {
  @IsNotEmpty()
  receiverId: string;

  @IsNotEmpty()
  annonceId: string;

  @IsEnum(['TEXT', 'VOICE', 'IMAGE'])
  type: string = 'TEXT';

  @IsNotEmpty()
  content: string;
}
