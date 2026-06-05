//confirma que o servidor está rodando corretamente

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {} //injeta o appservice dentro do controller
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
