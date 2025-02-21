import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { User } from '../../../../schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import {
  EmailVerifyStartResponse,
  ForgotPasswordResponse,
  LoginResponse,
  RefreshTokenResponse,
  RegisterGhostResponse,
  RegisterResponse,
} from '../../../../proto-ts/auth/auth.pb';
import { GlobalResponse } from '../../../../proto-ts/common/common.pb';
import { LogoutDto } from './dto/logout.dto';
import { RegisterDto } from './dto/register.dto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { EmailVerifyStartDto } from './dto/emailVerifyStart.dto';
import { EmailVerifyFinishDto } from './dto/emailVerifyFinish.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { JwtService } from '@nestjs/jwt';
import { encrypt, decrypt } from '../../../../common/utils/encryptDecrypt';
import { RegisterGhostsDto } from './dto/registerGhost.dto';
import { RegisterGhosts } from '../../../../schemas/registerGhosts.schema';
import { MailService } from '../../../../common/modules/mail/mail.service';
import { ForgotPasswordVerifyDto } from './dto/forgotPasswordVerify.dto';

interface JwtPayload {
  sub: string;
  type:
    | 'register_token'
    | 'access_token'
    | 'refresh_token'
    | 'password_verify'
    | 'password_reset'
    | 'email_verify';
  [key: string]: unknown;
}

@Injectable()
export class AuthGRPCService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(RegisterGhosts.name)
    private readonly registerGhostsModel: Model<RegisterGhosts>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  private generateTokens(
    userId: string,
    data: Partial<JwtPayload> = {},
    options: { expiresIn?: string } = {},
  ) {
    const payload: JwtPayload = {
      sub: userId,
      ...data,
      type: data.type ?? 'access_token',
    };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(
        { ...payload, type: 'refresh_token' },
        {
          expiresIn: options.expiresIn ?? process.env.JWT_REFRESH_EXPIRES_IN,
        },
      ),
    };
  }

  async registerGhost(
    request: RegisterGhostsDto,
  ): Promise<RegisterGhostResponse> {
    const existingEmail = await this.userModel.findOne({
      email: request.email,
    });
    const existingUsername = await this.userModel.findOne({
      username: request.username,
    });
    const messages: string[] = [];

    if (existingEmail) {
      messages.push(`Email ${request.email} already using`);
    }
    if (existingUsername) {
      messages.push(`Username ${request.username} already using`);
    }
    if (messages.length > 0) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: messages.join(', '),
      });
    }

    const verificationCode = Math.floor(111111 + Math.random() * 999999);

    const registerGhosts = await this.registerGhostsModel.create({
      _id: new mongoose.Types.ObjectId(),
      username: request.username,
      email: request.email,
      password: request.password,
      verificationCode,
    });

    const bcryptSecret = process.env.BCRYPT_SECRET?.substring(0, 32);
    if (!bcryptSecret) {
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Encryption key not found',
      });
    }

    const tokens = this.generateTokens(
      registerGhosts._id.toString(),
      {
        type: 'register_token',
        ecu: encrypt(registerGhosts.username, bcryptSecret),
        ece: encrypt(registerGhosts.email, bcryptSecret),
        ecp: encrypt(request.password, bcryptSecret),
        ecv: encrypt(verificationCode.toString(), bcryptSecret),
      },
      { expiresIn: '2m' },
    );

    this.mailService.sendRegisterVerificationCode(
      request.email,
      verificationCode,
    );

    return {
      metadata: {
        status: 'success',
        code: '0',
        message: 'Register ghost successful',
      },
      registerToken: tokens.accessToken,
    };
  }

  async register(request: RegisterDto): Promise<RegisterResponse> {
    const payload = this.jwtService.verify<JwtPayload>(request.registerToken);
    if (payload.type !== 'register_token') {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid register token',
      });
    }

    const bcryptSecret = process.env.BCRYPT_SECRET?.substring(0, 32);
    if (!bcryptSecret) {
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Encryption key not found',
      });
    }

    const decryptedVerificationCode = decrypt(
      payload.ecv as string,
      bcryptSecret,
    );

    if (decryptedVerificationCode !== request.verificationCode) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid verification code',
      });
    }

    // this account already created
    const existingUser = await this.userModel.findOne({
      email: decrypt(payload.ece as string, bcryptSecret),
    });

    if (existingUser) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'User already exists',
      });
    }
    const registerGhost = await this.registerGhostsModel.findById(
      new mongoose.Types.ObjectId(payload.sub),
    );

    if (!registerGhost) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid register token',
      });
    }

    const decryptedPassword = decrypt(payload.ecp as string, bcryptSecret);

    const user = await this.userModel.create({
      _id: new mongoose.Types.ObjectId(),
      username: decrypt(payload.ecu as string, bcryptSecret),
      email: decrypt(payload.ece as string, bcryptSecret),
      password: decryptedPassword,
    });

    await this.registerGhostsModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(payload.sub) },
      { $set: { userId: user._id } },
    );

    const tokens = this.generateTokens(user._id.toString(), {
      user: {
        username: user.username,
        email: user.email,
      },
    });

    return {
      metadata: {
        status: 'success',
        code: '0',
        message: 'Register successful',
      },
      ...tokens,
    };
  }

  async login(request: LoginDto): Promise<LoginResponse> {
    const user = await this.userModel
      .findOne({
        $or: [
          { email: request.emailOrUsername },
          { username: request.emailOrUsername },
        ],
      })
      .select('+password')
      .exec();

    if (!user) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Email or password is incorrect',
      });
    }

    const isPasswordValid = await user.comparePassword(request.password);

    if (!isPasswordValid) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Email or password is incorrect',
      });
    }

    const tokens = this.generateTokens(user._id.toString(), {
      user: {
        username: user.username,
        email: user.email,
      },
    });

    return {
      metadata: {
        status: 'success',
        code: '0',
        message: 'Login successful',
      },
      ...tokens,
    };
  }

  async refreshToken(request: RefreshTokenDto): Promise<RefreshTokenResponse> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(request.refreshToken);
      if (payload.type !== 'refresh_token') {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid refresh token',
        });
      }

      const user = await this.userModel.findById(
        new mongoose.Types.ObjectId(payload.sub),
      );

      if (!user) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid refresh token',
        });
      }

      const tokens = this.generateTokens(user._id.toString(), {
        user: {
          username: user.username,
          email: user.email,
        },
      });

      return {
        metadata: {
          status: 'success',
          code: '0',
          message: 'Refresh token successful',
        },
        ...tokens,
      };
    } catch {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid refresh token',
      });
    }
  }

  async logout(request: LogoutDto): Promise<GlobalResponse> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(request.accessToken);
      if (payload.type !== 'access_token') {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid access token',
        });
      }

      const user = await this.userModel.findById(
        new mongoose.Types.ObjectId(payload.sub),
      );

      if (!user) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid access token',
        });
      }

      return {
        metadata: {
          status: 'success',
          code: '0',
          message: 'Logout successful',
        },
      };
    } catch {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid access token',
      });
    }
  }

  async forgotPassword(
    request: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponse> {
    const user = await this.userModel.findOne({
      $or: [
        { email: request.emailOrUsername },
        { username: request.emailOrUsername },
      ],
    });

    if (!user) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'User not found',
      });
    }

    const verificationCode = Math.floor(111111 + Math.random() * 999999);

    const bcryptSecret = process.env.BCRYPT_SECRET?.substring(0, 32);
    if (!bcryptSecret) {
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Encryption key not found',
      });
    }

    const encryptedVerificationCode = encrypt(
      verificationCode.toString(),
      bcryptSecret,
    );

    const { accessToken } = this.generateTokens(
      user._id.toString(),
      {
        type: 'password_verify',
        ssv: encryptedVerificationCode,
      },
      { expiresIn: '2m' },
    );

    this.mailService.sendPasswordResetCode(user.email, verificationCode);

    return {
      metadata: {
        status: 'success',
        code: '0',
        message: 'Password Reset Code Sent',
      },
      verificationToken: accessToken,
    };
  }

  forgotPasswordVerify(
    request: ForgotPasswordVerifyDto,
  ): ForgotPasswordResponse {
    const payload = this.jwtService.verify<JwtPayload>(
      request.verificationToken,
    );

    if (payload.type !== 'password_verify') {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid token type',
      });
    }

    const bcryptSecret = process.env.BCRYPT_SECRET?.substring(0, 32);
    if (!bcryptSecret) {
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Encryption key not found',
      });
    }

    const decryptedVerificationCode = decrypt(
      payload.ssv as string,
      bcryptSecret,
    );

    if (decryptedVerificationCode !== request.code) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid verification code',
      });
    }

    const { accessToken } = this.generateTokens(
      payload.sub,
      {
        type: 'password_reset',
      },
      { expiresIn: '2m' },
    );

    return {
      metadata: {
        status: 'success',
        code: '0',
        message: 'Password reset successful',
      },
      verificationToken: accessToken,
    };
  }

  async resetPassword(request: ResetPasswordDto): Promise<GlobalResponse> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(
        request.verificationToken,
      );

      if (payload.type !== 'password_reset') {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid token type',
        });
      }

      const bcryptSecret = process.env.BCRYPT_SECRET?.substring(0, 32);
      if (!bcryptSecret) {
        throw new RpcException({
          code: status.INTERNAL,
          message: 'Encryption key not found',
        });
      }

      await this.userModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(payload.sub),
        {
          password: request.password,
        },
      );

      return {
        metadata: {
          status: 'success',
          code: '0',
          message: 'Password reset successful',
        },
      };
    } catch {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid or expired verification token',
      });
    }
  }

  async emailVerifyStart(
    request: EmailVerifyStartDto,
  ): Promise<EmailVerifyStartResponse> {
    const user = await this.userModel.findOne({ email: request.email });
    if (!user) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'User not found',
      });
    }

    const verificationToken = this.jwtService.sign(
      { sub: user._id.toString(), type: 'email_verify' },
      { expiresIn: '2d' },
    );

    return {
      metadata: {
        status: 'success',
        code: '0',
        message: 'Verification email sent',
      },
      verificationToken,
    };
  }

  async emailVerifyFinish(
    request: EmailVerifyFinishDto,
  ): Promise<GlobalResponse> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(
        request.verificationToken,
      );

      if (payload.type !== 'email_verify') {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid token type',
        });
      }

      await this.userModel.findByIdAndUpdate(payload.sub, {
        emailVerified: true,
      });

      return {
        metadata: {
          status: 'success',
          code: '0',
          message: 'Email verification successful',
        },
      };
    } catch {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid or expired verification token',
      });
    }
  }
}
