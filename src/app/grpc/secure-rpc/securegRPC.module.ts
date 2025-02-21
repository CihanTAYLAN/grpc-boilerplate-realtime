import { Module } from '@nestjs/common';
import { UserGRPCModule } from './user/usergRPC.module';

@Module({
  imports: [UserGRPCModule],
})
export class SecureGRPCModule {}
