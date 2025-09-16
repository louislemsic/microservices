import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { {{ServiceName}}Controller } from './{{service}}.controller';
import { {{ServiceName}}Service } from './{{service}}.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [{{ServiceName}}Controller],
  providers: [{{ServiceName}}Service],
})
export class {{ServiceName}}Module {}
