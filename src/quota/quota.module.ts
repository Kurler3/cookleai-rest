import { Module } from '@nestjs/common';
import { QuotaService } from './quota.service';


@Module({
  imports: [QuotaService]
})
export class QuotaModule {}
