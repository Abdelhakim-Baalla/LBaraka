import { Controller, Post, Get, Body, Param, UseGuards, UploadedFile, UseInterceptors, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  // Envoyer un message texte
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Envoyer un message texte' })
  @ApiResponse({ status: 201, description: 'Message envoyé' })
  @Post('text')
  async sendText(@Body() dto: CreateMessageDto, @Request() req: any) {
    const userId = req.user.userId;
    return this.chatService.create(userId, dto);
  }

  // Envoyer un message vocal
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Envoyer un message vocal' })
  @ApiResponse({ status: 201, description: 'Message vocal envoyé' })
  @Post('voice/:annonceId/:receiverId')
  @UseInterceptors(FileInterceptor('audio'))
  async sendVoice(
    @Param('annonceId') annonceId: string,
    @Param('receiverId') receiverId: string,
    @UploadedFile() file: any,
    @Request() req: any
  ) {
    const userId = req.user.userId;
    return this.chatService.sendVoiceMessage(userId, receiverId, annonceId, file.buffer);
  }

  // Récupérer une conversation
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer une conversation' })
  @ApiResponse({ status: 200, description: 'Conversation récupérée' })
  @Get('convo/:annonceId/:otherId')
  async getConvo(
    @Param('annonceId') annonceId: string,
    @Param('otherId') otherId: string,
    @Request() req: any
  ) {
    const userId = req.user.userId;
    return this.chatService.findConversation(userId, otherId, annonceId);
  }

  // Récupérer mes conversations
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer mes conversations' })
  @ApiResponse({ status: 200, description: 'Liste des conversations' })
  @Get('me')
  async getMyChats(@Request() req: any) {
    const userId = req.user.userId;
    return this.chatService.getMyConversations(userId);
  }
}
