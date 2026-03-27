import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './entities/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { StorageService } from '../storage/storage.service';

// Service pour gérer le chat
@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private storageService: StorageService,
  ) {}

  // Envoyer un message texte
  async create(senderId: string, createMessageDto: CreateMessageDto) {
    try {
      const newMessage = new this.messageModel({
        ...createMessageDto,
        senderId,
      });
      return await newMessage.save();
    } catch (e: any) {
      console.error('ERREUR MONGODB CHAT:', e.message);
      throw new InternalServerErrorException('Erreur envoi message');
    }
  }

  // Envoyer un message vocal
  async sendVoiceMessage(senderId: string, receiverId: string, annonceId: string, audioBuffer: Buffer) {
    try {
      // Upload le fichier audio sur MinIO
      const fileName = `voice-${senderId}-${Date.now()}.m4a`;
      const urlVocal = await this.storageService.uploadBuffer(audioBuffer, fileName, 'audio/m4a');

      // Enregistrer le message dans MongoDB
      const newMessage = new this.messageModel({
        senderId,
        receiverId,
        annonceId,
        type: 'VOICE',
        content: urlVocal,
      });

      return await newMessage.save();
    } catch (e) {
      throw new InternalServerErrorException('Erreur envoi message vocal');
    }
  }

  // Récupérer les messages d'une conversation
  async findConversation(userId: string, otherId: string, annonceId: string) {
    return this.messageModel
      .find({
        annonceId,
        $or: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId },
        ],
      })
      .sort({ createdAt: 1 })
      .exec();
  }

  // Récupérer toutes les conversations de l'utilisateur
  async getMyConversations(userId: string) {
    return this.messageModel.aggregate([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: { annonceId: '$annonceId', participants: { $setUnion: [['$senderId'], ['$receiverId']] } },
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]).exec();
  }
}
