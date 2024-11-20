import { Global, Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { UserModule } from '../user/user.module';

@Global()
@Module({
    imports: [UserModule],
    providers: [MembershipService],
    exports: [MembershipService]
})
export class MembershipModule {}