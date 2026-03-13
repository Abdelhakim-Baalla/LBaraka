import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  async createMessage(@Body() dto: CreateMessageDto) {
    return this.chatService.createMessage(dto);
  }

  @Get('conversations/:userAId/:userBId')
  async getConversation(
    @Param('userAId') userAId: string,
    @Param('userBId') userBId: string,
  ) {
    return this.chatService.getConversation(userAId, userBId);
  }
}

