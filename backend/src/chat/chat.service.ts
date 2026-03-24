import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './entities/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private storageService: StorageService,
  ) {}

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

  async sendVoiceMessage(senderId: string, receiverId: string, annonceId: string, audioBuffer: Buffer) {
    try {
      // 1. Upload vocal sur MinIO
      const fileName = `voice-${senderId}-${Date.now()}.m4a`;
      const urlVocal = await this.storageService.uploadBuffer(audioBuffer, fileName, 'audio/m4a');

      // 2. Enregistrer le message dans Mongo
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

  async getMyConversations(userId: string) {
    // Liste simplifiée : on récupère les derniers messages groupés par annonce et destinataire
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
