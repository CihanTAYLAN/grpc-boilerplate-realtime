import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const host: string = config.getOrThrow('MAIL_HOST');
        const port: number = config.getOrThrow('MAIL_PORT');
        const secure: boolean = config.getOrThrow('MAIL_SECURE', false);
        const user: string = config.getOrThrow('MAIL_USER');
        const pass: string = config.getOrThrow('MAIL_PASS');
        const from: string = config.getOrThrow('MAIL_FROM');
        const fromName: string = config.getOrThrow('MAIL_FROM_NAME');

        return {
          transport: {
            host,
            port,
            secure,
            auth: {
              user,
              pass,
            },
          },
          defaults: {
            from: `"${fromName}" <${from}>`,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
