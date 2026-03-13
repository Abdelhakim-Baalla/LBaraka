import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MongoClient, Collection, ObjectId } from 'mongodb';

export interface MessageChat {
  _id?: ObjectId;
  contenu: string;
  urlNoteVocale?: string;
  timestamp: Date;
  expediteurId: string;
  destinataireId: string;
}

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;

  constructor() {
    const mongoUrl =
      process.env.MONGODB_URL ??
      process.env.MONGODB_URI ??
      'mongodb://localhost:27017/lbaraka';

    this.client = new MongoClient(mongoUrl);
  }

  async onModuleInit() {
    await this.client.connect();

    const messages = this.getMessageCollection();
    await messages.createIndex({ expediteurId: 1, destinataireId: 1, timestamp: -1 });
    await messages.createIndex({ timestamp: -1 });
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  getMessageCollection(): Collection<MessageChat> {
    return this.client.db('lbaraka').collection<MessageChat>('messages_chat');
  }
}

