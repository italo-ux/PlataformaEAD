/*--- Funções ---*/
import { Injectable } from '@nestjs/common';

@Injectable() //indica que essa classe pode ser usada como provider
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
