import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GrpcModule } from './app/grpc/grpc.module';
import { WebModule } from './app/web/web.module';
import { RouterModule } from '@nestjs/core';
import { ApiModule } from './app/api/api.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    WebModule,
    ApiModule,
    GrpcModule,
    RouterModule.register([
      {
        path: '/',
        module: WebModule,
      },
      {
        path: '/api',
        module: ApiModule,
      },
    ]),
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'public'),
      serveRoot: '/public',
      serveStaticOptions: {
        index: false,
        dotfiles: 'ignore',
        redirect: false,
        maxAge: '1d',
      },
      renderPath: '/public',
      exclude: ['/api*'],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
