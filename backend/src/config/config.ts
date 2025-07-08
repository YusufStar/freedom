// Configuration for the mail backend system
import { z } from 'zod';

// Environment schema validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  JWT_SECRET: z.string().default('super-secret-jwt-key-change-this-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  DATABASE_URL: z.string().default('./data/maildb.sqlite'),
  ENCRYPTION_KEY: z.string().default('32-character-encryption-key-change-this'),
  
  // Mailcow API config
  MAILCOW_API_URL: z.string().default('https://mail.yusufstar.com/api/v1'),
  MAILCOW_API_KEY: z.string().default('40326A-5C2028-2DF160-287FB6-B73F1E'),
  MAILCOW_DOMAIN: z.string().default('yusufstar.com'),
  
  // Admin email
  ADMIN_EMAIL: z.string().default('07yusufstar@gmail.com'),
  
  // Mail sync
  SYNC_INTERVAL_SECONDS: z.string().default('30'),
  
  // CORS
  CORS_ORIGIN: z.string().default('*'),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  port: parseInt(env.PORT),
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  database: {
    url: env.DATABASE_URL,
  },
  encryption: {
    key: env.ENCRYPTION_KEY,
  },
  mailcow: {
    apiUrl: env.MAILCOW_API_URL,
    apiKey: env.MAILCOW_API_KEY,
    domain: env.MAILCOW_DOMAIN,
  },
  admin: {
    email: env.ADMIN_EMAIL,
  },
  sync: {
    intervalSeconds: parseInt(env.SYNC_INTERVAL_SECONDS),
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
} as const;

// Type export
export type Config = typeof config; 