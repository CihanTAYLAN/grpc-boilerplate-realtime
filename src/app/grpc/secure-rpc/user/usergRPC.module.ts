import { Module } from '@nestjs/common';
import { UserGRPCController } from './usergRPC.controller';
import { UserGRPCStreamService } from './usergRPC.stream.service';
import { UserGRPCService } from './usergRPC.service';
import { UserSchema } from '../../../../schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'User',
        schema: UserSchema,
      },
    ]),
  ],
  providers: [UserGRPCService, UserGRPCStreamService],
  controllers: [UserGRPCController],
  exports: [MongooseModule],
})
export class UserGRPCModule {}
