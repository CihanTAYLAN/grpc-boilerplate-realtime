import { Module } from '@nestjs/common';
import { SecureGRPCModule } from './secure-rpc/securegRPC.module';
import { PublicGRPCModule } from './public-rpc/publicgRPC.module';

@Module({
  imports: [PublicGRPCModule, SecureGRPCModule],
})
export class GrpcModule {}
