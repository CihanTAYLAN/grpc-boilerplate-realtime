import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { UserGRPCService } from './usergRPC.service';
import {
  GetUserRequest,
  GetUserResponse,
  GetUsersPaginationResponse,
} from '../../../../proto-ts/user/user.pb';
import { GlobalResponse } from '../../../../proto-ts/common/common.pb';
import { Observable } from 'rxjs';
import { UserGRPCStreamService } from './usergRPC.stream.service';
import { ValidateGrpcInput } from '../../../../common/gRPCValidator';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUserDto } from './dto/get-user.dto';
import { GetPaginationDto } from '../../../../common/dto/get-pagination.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ApiKeyGuard } from '../../../../common/guards/apiKey.guard';

@Controller()
@UseGuards(ApiKeyGuard, AuthGuard)
export class UserGRPCController {
  constructor(
    private readonly userService: UserGRPCService,
    private readonly userStreamService: UserGRPCStreamService,
  ) {}

  @GrpcMethod('UserService', 'CreateUser')
  @ValidateGrpcInput(CreateUserDto)
  async createUser(request: CreateUserDto): Promise<GetUserResponse> {
    return this.userService.createUser(request);
  }

  @GrpcMethod('UserService', 'GetUser')
  @ValidateGrpcInput(GetUserDto)
  getUser(request: GetUserDto): Promise<GetUserResponse> {
    return this.userService.getUser(request);
  }

  @GrpcStreamMethod('UserService', 'GetUserStream')
  @ValidateGrpcInput(Observable<GetUserRequest>)
  getUserStream(
    request: Observable<GetUserRequest>,
  ): Observable<GetUserResponse> {
    return this.userStreamService.getUserStream(request);
  }

  @GrpcMethod('UserService', 'GetUsersPagination')
  @ValidateGrpcInput(GetPaginationDto)
  getUsersPagination(
    request: GetPaginationDto,
  ): Promise<GetUsersPaginationResponse> {
    return this.userService.getUsersPagination(request);
  }

  @GrpcStreamMethod('UserService', 'GetUsersPaginationStream')
  @ValidateGrpcInput(Observable<GetPaginationDto>)
  getUsersPaginationStream(
    request: Observable<GetPaginationDto>,
  ): Observable<GetUsersPaginationResponse> {
    return this.userStreamService.getUsersPaginationStream(request);
  }

  @GrpcMethod('UserService', 'UpdateUser')
  @ValidateGrpcInput(UpdateUserDto)
  updateUser(request: UpdateUserDto): Promise<GetUserResponse> {
    return this.userService.updateUser(request);
  }

  @GrpcMethod('UserService', 'DeleteUser')
  @ValidateGrpcInput(DeleteUserDto)
  deleteUser(request: DeleteUserDto): Promise<GlobalResponse> {
    return this.userService.deleteUser(request);
  }
}
