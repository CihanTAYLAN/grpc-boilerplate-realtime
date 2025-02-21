import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const metadata: Metadata = context.switchToRpc().getContext();
    const authHeaders = metadata.get('authorization');
    const authHeader = authHeaders?.[0];

    if (
      !authHeader ||
      typeof authHeader !== 'string' ||
      !authHeader.startsWith('Bearer ')
    ) {
      throw new RpcException('Invalid auth metadata');
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new RpcException('JWT_SECRET is not defined');
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      metadata.set('user', JSON.stringify(decoded));
      return true;
    } catch {
      throw new RpcException('Invalid token');
    }
  }
}
