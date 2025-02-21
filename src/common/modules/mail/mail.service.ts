import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(private readonly mailerService: MailerService) {}

  sendEmail(email: string, subject: string, message: string): void {
    this.mailerService
      .sendMail({
        to: email,
        subject,
        template: 'common',
        context: {
          title: subject,
          message: message,
        },
      })
      .catch((error) => {
        this.logger.error(error);
      });
  }

  sendRegisterVerificationCode(email: string, code: number): void {
    this.mailerService
      .sendMail({
        to: email,
        subject: 'Verification Code - GrpcBoilerplate',
        template: 'verification-code',
        context: {
          code,
        },
      })
      .catch((error) => {
        this.logger.error(error);
      });
  }

  sendPasswordResetCode(email: string, code: number): void {
    this.mailerService
      .sendMail({
        to: email,
        subject: 'Password Reset Code - GrpcBoilerplate',
        template: 'password-reset',
        context: {
          code,
        },
      })
      .catch((error) => {
        this.logger.error(error);
      });
  }
}
