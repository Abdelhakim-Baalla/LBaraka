import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { MongoService } from '../mongo/mongo.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly mongoService: MongoService) {}

  async createMessage(dto: CreateMessageDto) {
    const collection = this.mongoService.getMessageCollection();

    const message = {
      contenu: dto.contenu,
      urlNoteVocale: dto.urlNoteVocale,
      expediteurId: dto.expediteurId,
      destinataireId: dto.destinataireId,
      timestamp: new Date(),
    };

    const result = await collection.insertOne(message);

    return {
      id: result.insertedId.toString(),
      ...message,
    };
  }

  async getConversation(userAId: string, userBId: string) {
    const collection = this.mongoService.getMessageCollection();

    const messages = await collection
      .find({
        $or: [
          { expediteurId: userAId, destinataireId: userBId },
          { expediteurId: userBId, destinataireId: userAId },
        ],
      })
      .sort({ timestamp: 1 })
      .toArray();

    return messages.map((message) => ({
      ...message,
      _id: message._id instanceof ObjectId ? message._id.toString() : message._id,
    }));
  }
}

