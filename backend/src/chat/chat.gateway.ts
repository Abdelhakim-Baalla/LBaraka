import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { NotificationService } from '../notification/notification.service';

interface JoinRoomPayload {
    transactionId: string;
    userId: string;
}

interface SendMessagePayload {
    transactionId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type?: 'TEXT' | 'IMAGE';
}

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    constructor(
        private readonly chatService: ChatService,
        private readonly notificationService: NotificationService,
    ) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connecté: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client déconnecté: ${client.id}`);
    }

    @SubscribeMessage('joinRoom')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: JoinRoomPayload,
    ) {
        const { transactionId, userId } = payload;
        const roomName = `transaction_${transactionId}`;

        client.join(roomName);
        this.logger.log(`Utilisateur ${userId} a rejoint la room ${roomName}`);

        client.to(roomName).emit('userJoined', {
            userId,
            message: 'a rejoint la conversation',
            timestamp: new Date(),
        });

        const history = await this.chatService.findConversation(
            userId,
            userId,
            transactionId,
        );

        return {
            event: 'roomJoined',
            data: {
                roomName,
                transactionId,
                messages: history,
            }
        };
    }

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: JoinRoomPayload,
    ) {
        const { transactionId, userId } = payload;
        const roomName = `transaction_${transactionId}`;

        client.leave(roomName);
        this.logger.log(`Utilisateur ${userId} a quitté la room ${roomName}`);

        client.to(roomName).emit('userLeft', {
            userId,
            message: 'a quitté la conversation',
            timestamp: new Date(),
        });

        return { event: 'roomLeft', data: { roomName } };
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: SendMessagePayload,
    ) {
        this.logger.debug(`Payload type: ${typeof payload}`);
        this.logger.debug(`Fields: trans=${payload.transactionId}, sender=${payload.senderId}, receiver=${payload.receiverId}`);
        
        const { transactionId, senderId, receiverId, content, type = 'TEXT' } = payload;
        const roomName = `transaction_${transactionId}`;

        try {
            const messageDto: CreateMessageDto = {
                receiverId,
                annonceId: transactionId,
                type,
                content,
            };

            const savedMessage = await this.chatService.create(senderId, messageDto);
            const messageId = (savedMessage as any)._id || (savedMessage as any).id;
            const timestamp = (savedMessage as any).createdAt || new Date();

            this.server.to(roomName).emit('receiveMessage', {
                id: messageId,
                senderId,
                receiverId,
                content,
                type,
                timestamp,
            });

            this.server.to(`user_${receiverId}`).emit('newMessageNotification', {
                from: senderId,
                transactionId,
                preview: content.substring(0, 50),
            });

            // --- NOUVEAUTÉ : PERSISTANCE NOTIFICATION CHAT ---
            await this.notificationService.create(
                receiverId,
                '💬 Nouveau message',
                `Vous avez un nouveau message concernant l'échange #${transactionId.substring(0, 8)}`
            );

            return {
                event: 'messageSent',
                data: {
                    success: true,
                    messageId,
                }
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Erreur envoi message: ${errorMessage}`);
            return {
                event: 'messageError',
                data: {
                    success: false,
                    error: 'Erreur lors de l\'envoi du message'
                }
            };
        }
    }

    @SubscribeMessage('typing')
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { transactionId: string; userId: string },
    ) {
        const { transactionId, userId } = payload;
        const roomName = `transaction_${transactionId}`;

        client.to(roomName).emit('userTyping', {
            userId,
            timestamp: new Date(),
        });
    }

    @SubscribeMessage('registerNotifications')
    handleRegisterNotifications(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { userId: string },
    ) {
        const { userId } = payload;
        client.join(`user_${userId}`);
        this.logger.log(`Utilisateur ${userId} enregistré pour les notifications`);

        return { event: 'registered', data: { success: true } };
    }
}
