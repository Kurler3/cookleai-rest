import { Global, Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Global()
@Module({
  providers: [GeminiService],
  exports: [GeminiService]
})
export class GeminiModule {}
