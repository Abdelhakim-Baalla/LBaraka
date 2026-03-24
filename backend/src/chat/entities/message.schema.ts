import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  senderId: string;

  @Prop({ required: true })
  receiverId: string;

  @Prop({ required: true })
  annonceId: string; // Pour lier le chat à un objet spécifique

  @Prop({ required: true, enum: ['TEXT', 'VOICE'] })
  type: string;

  @Prop()
  content: string; // Texte du message OU URL MinIO pour l'audio

  @Prop({ default: false })
  isRead: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
