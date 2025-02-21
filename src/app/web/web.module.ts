import { Module } from '@nestjs/common';
import { WebController } from './web.controller';
import { WebService } from './web.service';

@Module({
  controllers: [WebController],
  providers: [WebService],
})
export class WebModule {}
