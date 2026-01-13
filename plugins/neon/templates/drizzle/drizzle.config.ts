import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export default defineConfig({
  // Schema location
  schema: './src/db/schema.ts',

  // Migration output directory
  out: './drizzle',

  // Database dialect
  dialect: 'postgresql',

  // Connection credentials
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },

  // Enable verbose logging
  verbose: true,

  // Enable strict mode for type safety
  strict: true,

  // Migration settings (optional)
  migrations: {
    prefix: 'timestamp',
    table: '__drizzle_migrations__',
    schema: 'public',
  },
});
