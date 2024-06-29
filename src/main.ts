import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //TODO
//   //enable cors
//  app.enableCors({
//   origin: 'http://localhost:3000',
// });

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
