import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mongoUri =
          configService.get<string>('MONGODB_URL') ??
          configService.get<string>('MONGODB_URI') ??
          'mongodb://localhost:27017/lbaraka';

        return {
          uri: mongoUri,
          dbName: 'lbaraka',
        };
      },
    }),
  ],
  exports: [MongooseModule],
})
export class MongoModule {}

