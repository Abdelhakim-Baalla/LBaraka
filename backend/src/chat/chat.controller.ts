import { Controller, Post, Get, Body, Param, UseGuards, UploadedFile, UseInterceptors, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('text')
  async sendText(@Body() dto: CreateMessageDto, @Request() req: any) {
    const userId = req.user.userId;
    return this.chatService.create(userId, dto);
  }

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

  @Get('convo/:annonceId/:otherId')
  async getConvo(
    @Param('annonceId') annonceId: string,
    @Param('otherId') otherId: string,
    @Request() req: any
  ) {
    const userId = req.user.userId;
    return this.chatService.findConversation(userId, otherId, annonceId);
  }
}
