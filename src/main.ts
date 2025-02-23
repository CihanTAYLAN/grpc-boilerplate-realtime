import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { ReflectionService } from '@grpc/reflection';
import { PackageDefinition } from '@grpc/proto-loader';
import { Server } from '@grpc/grpc-js';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import apiDoc from './apiDoc';

const logger = new Logger('GrpcBoilerplate');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      onLoadPackageDefinition: (pkg: PackageDefinition, server: Server) => {
        new ReflectionService(pkg).addToServer(server);
      },
      package: ['grpcBoilerplate.user', 'grpcBoilerplate.auth'],
      protoPath: join(__dirname, '/protos/grpcBoilerplate.proto'),
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [join(__dirname, '/protos')],
      },
      url: `${configService.get('GRPC_HOST', '0.0.0.0')}:${configService.get('GRPC_PORT')}`,
    },
  });

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, 'views'));
  app.setViewEngine('hbs');

  apiDoc(app);

  await app.startAllMicroservices();
  await app.listen(configService.get('RPC_PORT', 8000));

  logger.verbose(`🚀 Rest API is running on: ${await app.getUrl()}`);
  logger.verbose(
    `🔌 gRPC server is running on: ${configService.get('GRPC_HOST', '0.0.0.0')}:${configService.get('GRPC_PORT', 8001)}`,
  );
  logger.verbose(`🚀 Rest Docs: ${await app.getUrl()}/rest-doc`);
  logger.verbose(`🔌 GRPC Docs: ${await app.getUrl()}/grpc-doc`);
}
bootstrap().catch((err) => {
  logger.error('Failed to start application:', err);
  process.exit(1);
});
