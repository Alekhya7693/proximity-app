import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

function parseConnectionString(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '5432', 10),
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace('/', ''),
  };
}

export function getDatabaseConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  const connectionConfig = databaseUrl
    ? parseConnectionString(databaseUrl)
    : {
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'proximity'),
        password: configService.get<string>('DB_PASSWORD', 'proximity_secret'),
        database: configService.get<string>('DB_DATABASE', 'proximity_db'),
      };

  const useSsl = databaseUrl
    ? true
    : configService.get<boolean>('DB_SSL', false);

  return {
    type: 'postgres',
    ...connectionConfig,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
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
const databaseUrl = process.env.DATABASE_URL;
const cliConnectionConfig = databaseUrl
  ? parseConnectionString(databaseUrl)
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'proximity',
      password: process.env.DB_PASSWORD || 'proximity_secret',
      database: process.env.DB_DATABASE || 'proximity_db',
    };

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  ...cliConnectionConfig,
  ssl: databaseUrl ? { rejectUnauthorized: false } : false,
  entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
