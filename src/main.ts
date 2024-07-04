import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Inject http only cookies
  app.use(
    cookieParser()
  )

  //enable cors
  app.enableCors({
    origin: 'http://localhost:5173',
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  // Listen
  await app.listen(3000);
}
bootstrap();
