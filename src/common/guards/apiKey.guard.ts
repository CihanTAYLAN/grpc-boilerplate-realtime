import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const metadata: Metadata = context.switchToRpc().getContext();
    const apiKeys = metadata.get('x-api-key');
    const apiKey = apiKeys?.[0];

    if (!apiKey || apiKey !== process.env.API_KEY) {
      throw new RpcException('Invalid API Key');
    }

    return true;
  }
}
