import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServiceLoaderModule } from './service-loader/service-loader.module';

@Module({
  imports: [ServiceLoaderModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
