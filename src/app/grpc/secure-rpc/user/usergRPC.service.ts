import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { UserDocument } from '../../../../schemas/user.schema';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  GetUserResponse,
  GetUsersPaginationResponse,
} from '../../../../proto-ts/user/user.pb';
import { GlobalResponse } from '../../../../proto-ts/common/common.pb';
import { mapUserToResponse } from './util';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUserDto } from './dto/get-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetPaginationDto } from '../../../../common/dto/get-pagination.dto';
import { DeleteUserDto } from './dto/delete-user.dto';

@Injectable()
export class UserGRPCService implements OnModuleInit {
  constructor(
    @InjectModel('User')
    private readonly userModel: Model<UserDocument>,
  ) {}

  onModuleInit() {
    // Initialize any necessary setup
  }

  async createUser(request: CreateUserDto): Promise<GetUserResponse> {
    try {
      const existingEmail = await this.userModel
        .findOne({ email: request.email })
        .exec();
      const existingUsername = await this.userModel
        .findOne({ username: request.username })
        .exec();

      const messages: string[] = [];
      if (existingEmail) {
        messages.push('Email already registered');
      }
      if (existingUsername) {
        messages.push('Username already registered');
      }

      if (messages.length > 0) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: messages.join(', '),
        });
      }

      const user = await this.userModel.create({
        _id: new mongoose.Types.ObjectId(),
        ...request,
      });

      return {
        metadata: {
          status: 'success',
          code: '0',
          message: 'User created successfully',
        },
        user: mapUserToResponse(user),
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        code: status.INTERNAL,
        message: 'An internal error occurred',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  async getUser(request: GetUserDto): Promise<GetUserResponse> {
    const user = await this.userModel
      .findById(new mongoose.Types.ObjectId(request.id))
      .exec();

    if (!user) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'User not found',
      });
    }

    return {
      metadata: {
        status: 'success',
        code: '0',
        message: 'User fetched successfully',
      },
      user: mapUserToResponse(user),
    };
  }

  async getUsersPagination(
    request: GetPaginationDto,
  ): Promise<GetUsersPaginationResponse> {
    try {
      const page: number = request?.page ?? 1;
      const itemsPerPage: number = request?.itemsPerPage ?? 10;

      const users = await this.userModel
        .find()
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);

      const totalItems = await this.userModel.countDocuments();

      const rs: GetUsersPaginationResponse = {
        metadata: {
          status: 'success',
          code: '0',
          message: 'Users fetched successfully',
        },
        users: users.map(mapUserToResponse),
        paginationMetadata: {
          pageItems: users.length,
          currentPage: page,
          totalPages: Math.ceil(totalItems / itemsPerPage),
          totalItems: totalItems,
        },
      };

      return rs;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        code: status.INTERNAL,
        message: 'An internal error occurred',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  async updateUser(request: UpdateUserDto): Promise<GetUserResponse> {
    if (request.email) {
      const existingUser = await this.userModel
        .findOne({
          email: request.email,
          _id: { $ne: new mongoose.Types.ObjectId(request.id) },
        })
        .exec();
      if (existingUser) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'Email already registered',
          details: {
            field: 'email',
            value: request.email,
          },
        });
      }
    }

    const user = await this.userModel
      .findByIdAndUpdate(new mongoose.Types.ObjectId(request.id), {
        ...(request.username && { username: request.username }),
        ...(request.email && { email: request.email }),
        ...(request.password && { password: request.password }),
      })
      .exec();

    if (!user) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'User not found',
      });
    }

    return {
      metadata: {
        status: 'success',
        code: '0',
        message: 'User updated successfully',
      },
      user: mapUserToResponse(user),
    };
  }

  async deleteUser(request: DeleteUserDto): Promise<GlobalResponse> {
    const user = await this.userModel
      .findByIdAndDelete(new mongoose.Types.ObjectId(request.id))
      .exec();

    if (!user) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'User not found',
      });
    }

    return {
      metadata: {
        status: 'success',
        code: '0',
        message: 'User deleted successfully',
      },
    };
  }
}
