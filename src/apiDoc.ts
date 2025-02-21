import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTheme } from 'swagger-themes';
import { SwaggerThemeNameEnum } from 'swagger-themes/build/enums/swagger-theme-name';

export default function apiDoc(app: NestExpressApplication) {
  const config = new DocumentBuilder()
    .setTitle('Rest API Documentation')
    .setDescription('Rest API Documentation')
    .setVersion('1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'jwtUserAuth',
    );
  if (process.env.NODE_ENV == 'development') {
    config.addServer('http://127.0.0.1:' + process.env.APP_PORT, 'Localhost');
  }

  const document = SwaggerModule.createDocument(app, config.build());
  const theme = new SwaggerTheme();

  SwaggerModule.setup('swagger-doc', app, document, {
    customCss: theme.getBuffer(SwaggerThemeNameEnum.DARK),
  });
}
