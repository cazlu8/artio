import { DynamicModule, MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthMiddleware } from './shared/middlewares/auth.middleware';
import { loadModules, loadControllers } from './modules';
import * as ormconfig from './ormconfig';

// read all modules folders and load all available modules
const modules: DynamicModule[] = loadModules();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => ormconfig as any,
    }),
    ...modules,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    const controllers: any = loadControllers();
  //  consumer.apply(AuthMiddleware).forRoutes(...controllers);
  }
}
