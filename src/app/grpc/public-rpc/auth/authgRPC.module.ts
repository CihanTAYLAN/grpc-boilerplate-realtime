import { Module } from '@nestjs/common';
import { AuthGRPCController } from './authgRPC.controller';
import { AuthGRPCService } from './authgRPC.service';
import { User, UserSchema } from '../../../../schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  RegisterGhosts,
  RegisterGhostsSchema,
} from '../../../../schemas/registerGhosts.schema';
import { MailModule } from '../../../../common/modules/mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RegisterGhosts.name, schema: RegisterGhostsSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
    MailModule,
  ],
  controllers: [AuthGRPCController],
  providers: [AuthGRPCService],
  exports: [],
})
export class AuthGRPCModule {}
