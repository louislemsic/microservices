import { DynamicModule, Module } from '@nestjs/common';
import { ServiceLoaderService } from './service-loader.service';
import { UsersModule } from '../../services/users/users.module';
import { PostsModule } from '../../services/posts/posts.module';

@Module({})
export class ServiceLoaderModule {
  static forRoot(): DynamicModule {
    // For now, we'll manually import known services
    // In a more advanced implementation, this could be made fully dynamic
    const imports = [UsersModule, PostsModule];

    return {
      module: ServiceLoaderModule,
      imports,
      providers: [ServiceLoaderService],
      exports: [ServiceLoaderService],
    };
  }
}
