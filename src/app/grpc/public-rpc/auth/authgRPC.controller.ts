import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ValidateGrpcInput } from '../../../../common/gRPCValidator';
import { AuthGRPCService } from './authgRPC.service';
import { LoginDto } from './dto/login.dto';
import { GlobalResponse } from '../../../../proto-ts/common/common.pb';
import {
  EmailVerifyStartResponse,
  ForgotPasswordResponse,
  LoginResponse,
  RefreshTokenResponse,
  RegisterGhostResponse,
  RegisterResponse,
} from '../../../../proto-ts/auth/auth.pb';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { LogoutDto } from './dto/logout.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { EmailVerifyStartDto } from './dto/emailVerifyStart.dto';
import { EmailVerifyFinishDto } from './dto/emailVerifyFinish.dto';
import { RegisterGhostsDto } from './dto/registerGhost.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordVerifyDto } from './dto/forgotPasswordVerify.dto';
import { ApiKeyGuard } from '../../../../common/guards/apiKey.guard';

@Controller()
@UseGuards(ApiKeyGuard)
export class AuthGRPCController {
  constructor(private readonly authService: AuthGRPCService) {}

  @GrpcMethod('AuthService', 'RegisterGhost')
  @ValidateGrpcInput(RegisterGhostsDto)
  async registerGhost(
    request: RegisterGhostsDto,
  ): Promise<RegisterGhostResponse> {
    return this.authService.registerGhost(request);
  }

  @GrpcMethod('AuthService', 'Register')
  @ValidateGrpcInput(RegisterDto)
  async register(request: RegisterDto): Promise<RegisterResponse> {
    return this.authService.register(request);
  }

  @GrpcMethod('AuthService', 'Login')
  @ValidateGrpcInput(LoginDto)
  async login(request: LoginDto): Promise<LoginResponse> {
    return this.authService.login(request);
  }

  @GrpcMethod('AuthService', 'RefreshToken')
  @ValidateGrpcInput(RefreshTokenDto)
  async refreshToken(request: RefreshTokenDto): Promise<RefreshTokenResponse> {
    return this.authService.refreshToken(request);
  }

  @GrpcMethod('AuthService', 'Logout')
  @ValidateGrpcInput(LogoutDto)
  async logout(request: LogoutDto): Promise<GlobalResponse> {
    return this.authService.logout(request);
  }

  @GrpcMethod('AuthService', 'ForgotPassword')
  @ValidateGrpcInput(ForgotPasswordDto)
  async forgotPassword(
    request: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponse> {
    return this.authService.forgotPassword(request);
  }

  @GrpcMethod('AuthService', 'ForgotPasswordVerify')
  @ValidateGrpcInput(ForgotPasswordVerifyDto)
  forgotPasswordVerify(
    request: ForgotPasswordVerifyDto,
  ): ForgotPasswordResponse {
    return this.authService.forgotPasswordVerify(request);
  }

  @GrpcMethod('AuthService', 'ResetPassword')
  @ValidateGrpcInput(ResetPasswordDto)
  async resetPassword(request: ResetPasswordDto): Promise<GlobalResponse> {
    return this.authService.resetPassword(request);
  }

  @GrpcMethod('AuthService', 'EmailVerifyStart')
  @ValidateGrpcInput(EmailVerifyStartDto)
  async emailVerifyStart(
    request: EmailVerifyStartDto,
  ): Promise<EmailVerifyStartResponse> {
    return this.authService.emailVerifyStart(request);
  }

  @GrpcMethod('AuthService', 'EmailVerifyFinish')
  @ValidateGrpcInput(EmailVerifyFinishDto)
  async emailVerifyFinish(
    request: EmailVerifyFinishDto,
  ): Promise<GlobalResponse> {
    return this.authService.emailVerifyFinish(request);
  }
}
