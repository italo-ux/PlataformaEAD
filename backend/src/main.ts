import 'dotenv/config';
import { NestFactory } from '@nestjs/core'; //inicia a aplicação nestjs
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false }); //sobe o servidor na porta definida
  app.enableCors(); //permite que o back se conecte no front
  // O limite comporta até oito PNGs de 1 MiB após a expansão do base64.
  app.use(json({ limit: '12mb' }));
  app.use(urlencoded({ extended: true, limit: '12mb' }));
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
