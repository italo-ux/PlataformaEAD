import 'dotenv/config';
import { NestFactory } from '@nestjs/core'; //inicia a aplicação nestjs
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); // Sobe o servidor

  app.enableCors(); // Permite que o back se conecte com o front

  //  Habilita a validação global dos DTOs com o ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades que não estão no DTO
      forbidNonWhitelisted: true, // Bloqueia requisições com propriedades não permitidas
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('Erro ao iniciar a aplicação:', err); // Inicia a aplicação e captura erros
});
