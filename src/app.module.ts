import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import ormconfig from '@app/ormconfig';
import { AppController } from '@app/app.controller';
import { AppService } from '@app/app.service';
import { UserModule } from '@app/user/user.module';
import { config } from '@app/lib/config';
import { AuthMiddleware } from './user/middleware/auth.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config]
    }),
    TypeOrmModule.forRoot(ormconfig),
    UserModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      {
        path: 'user/reset-password',
        method: RequestMethod.ALL
      },
      {
        path: 'user/info',
        method: RequestMethod.ALL
      },
      {
        path: 'user/all-info',
        method: RequestMethod.ALL
      },
      {
        path: 'user/update',
        method: RequestMethod.ALL
      }
    );
  }
}
