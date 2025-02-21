import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserDocument } from '../../../../schemas/user.schema';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  GetUserRequest,
  GetUserResponse,
  GetUsersPaginationResponse,
} from '../../../../proto-ts/user/user.pb';
import { Observable } from 'rxjs';
import { mapUserToResponse } from './util';
import { GetPaginationDto } from '../../../../common/dto/get-pagination.dto';

@Injectable()
export class UserGRPCStreamService implements OnModuleInit {
  constructor(
    @InjectModel('User')
    private readonly userModel: Model<UserDocument>,
  ) {}

  onModuleInit() {
    // Initialize any necessary setup
  }

  getUserStream(
    request: Observable<GetUserRequest>,
  ): Observable<GetUserResponse> {
    return new Observable((subscriber) => {
      const changeStream = this.userModel.watch();

      const subscription = request.subscribe({
        next: (req) => {
          void this.fetchAndEmitUser(subscriber, req.id);
        },
        error: (error: Error) => {
          subscriber.error(
            new RpcException({
              code: status.INTERNAL,
              message: 'Stream error',
              details: { error: error.message },
            }),
          );
        },
      });

      changeStream.on(
        'change',
        (change: {
          operationType: string;
          documentKey: { _id: { toString: () => string } };
        }) => {
          if (
            change.operationType === 'update' ||
            change.operationType === 'replace'
          ) {
            const userId = change.documentKey._id.toString();
            void this.fetchAndEmitUser(subscriber, userId);
          }
        },
      );

      changeStream.on('error', (error: Error) => {
        subscriber.error(
          new RpcException({
            code: status.INTERNAL,
            message: 'Change stream error',
            details: { error: error.message },
          }),
        );
      });

      return () => {
        subscription.unsubscribe();
        void changeStream.close();
      };
    });
  }

  private async fetchAndEmitUser(
    subscriber: {
      next: (value: GetUserResponse) => void;
      error: (error: RpcException) => void;
    },
    id: string,
  ) {
    if (!id || !Types.ObjectId.isValid(id)) {
      subscriber.error(
        new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Invalid user ID',
        }),
      );
      return;
    }
    const user = await this.userModel.findById(new Types.ObjectId(id)).exec();

    if (!user) {
      subscriber.error(
        new RpcException({
          code: status.NOT_FOUND,
          message: 'User not found',
        }),
      );
      return;
    }

    const userResponse = mapUserToResponse(user);

    const rs: GetUserResponse = {
      metadata: {
        status: 'success',
        code: '0',
        message: 'User fetched successfully',
      },
      user: userResponse,
    };

    subscriber.next(rs);
  }

  getUsersPaginationStream(
    request: Observable<GetPaginationDto>,
  ): Observable<GetUsersPaginationResponse> {
    return new Observable((subscriber) => {
      // onChange pagination params
      request.subscribe({
        next: (req) => {
          const page: number = req?.page ?? 1;
          const itemsPerPage: number = req?.itemsPerPage ?? 10;
          void this.fetchAndEmitUsersPagination(subscriber, page, itemsPerPage);
        },
      });

      // on change db Data

      const changeStream = this.userModel.watch();
      changeStream.on(
        'change',
        () => void this.fetchAndEmitUsersPagination(subscriber, 1, 10),
      );

      changeStream.on('error', (error: Error) => {
        subscriber.error(
          new RpcException({
            code: status.INTERNAL,
            message: 'Change stream error',
            details: { error: error.message },
          }),
        );
      });

      return () => {
        void changeStream.close();
      };
    });
  }

  private async fetchAndEmitUsersPagination(
    subscriber: {
      next: (value: GetUsersPaginationResponse) => void;
      error: (error: RpcException) => void;
    },
    page: number,
    itemsPerPage: number,
  ) {
    try {
      const users = await this.userModel
        .find()
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);

      subscriber.next({
        metadata: {
          status: 'success',
          code: '0',
          message: 'Users fetched successfully',
        },
        users: users.map(mapUserToResponse),
        paginationMetadata: {
          pageItems: users.length,
          currentPage: page,
          totalPages: Math.ceil(users.length / itemsPerPage),
          totalItems: users.length,
        },
      });
    } catch (error) {
      subscriber.error(
        new RpcException({
          code: status.INTERNAL,
          message: 'Failed to fetch users',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        }),
      );
    }
  }
}
