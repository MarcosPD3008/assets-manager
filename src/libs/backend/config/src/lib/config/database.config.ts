import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432', 10),
  username: process.env['DB_USERNAME'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'password',
  database: process.env['DB_DATABASE'] || 'nest_monorepo',
  // entities will be passed explicitly from the module
  synchronize: process.env['NODE_ENV'] !== 'production',
  logging: process.env['NODE_ENV'] === 'development',
  dropSchema: false,
  ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
}));

