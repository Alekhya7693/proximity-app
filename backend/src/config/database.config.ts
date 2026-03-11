import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export function getDatabaseConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'proximity'),
    password: configService.get<string>('DB_PASSWORD', 'proximity_secret'),
    database: configService.get<string>('DB_DATABASE', 'proximity_db'),
    ssl: configService.get<boolean>('DB_SSL', false)
      ? { rejectUnauthorized: false }
      : false,
    entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
    logging: configService.get<boolean>('DB_LOGGING', false),
    autoLoadEntities: true,
    extra: {
      max: 20,
      connectionTimeoutMillis: 10000,
    },
  };
}

// DataSource for CLI migrations
const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'proximity',
  password: process.env.DB_PASSWORD || 'proximity_secret',
  database: process.env.DB_DATABASE || 'proximity_db',
  entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
