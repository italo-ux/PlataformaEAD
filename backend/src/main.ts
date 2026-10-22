import 'dotenv/config';
import { NestFactory } from '@nestjs/core'; //inicia a aplicação nestjs
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); //sobe o servidor na porta definida
  app.enableCors(); //permite que o back se conecte no front
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Erro ao iniciar a aplicação:', err); //inicia a aplicação e captura erros
});
