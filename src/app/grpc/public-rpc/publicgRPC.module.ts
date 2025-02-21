import { Module } from '@nestjs/common';
import { AuthGRPCModule } from './auth/authgRPC.module';

@Module({
  imports: [AuthGRPCModule],
  providers: [],
})
export class PublicGRPCModule {}
