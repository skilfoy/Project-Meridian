import { defineConfig } from 'prisma/config';

// Load .env.local in development
try { require('dotenv').config({ path: '.env.local' }); } catch {}

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://meridian:meridian_dev@localhost:5432/meridian',
  },
});
