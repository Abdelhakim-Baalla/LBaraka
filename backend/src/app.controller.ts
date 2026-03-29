import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @ApiOperation({ summary: 'Vérification de santé de l\'API' })
  @ApiResponse({ status: 200, description: 'API opérationnelle' })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
