import { MongoClient, ObjectId } from "mongodb";

const mongoUrl = process.env.MONGODB_URL ?? process.env.MONGODB_URI ?? 'mongodb://localhost:27017/lbaraka';

const client = new MongoClient(mongoUrl);
const db = client.db("lbaraka");

export const messageChatCollection = db.collection("messages_chat");

export interface MessageChat {
    _id?: ObjectId;
    contenu: string;
    urlNoteVocale?: string;
    timestamp: Date;
    expediteurId: string;
    destinataireId: string;
}

export { client as mongoClient, db as mongoDb };
