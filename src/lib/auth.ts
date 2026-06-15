import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || 'https://ep-divine-credit-aot45rny.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth',
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET || 'dGhpcy1pcy1hLXNlY3VyZS1jb29raWUtc2VjcmV0LWZvci1vcmJpdC1hcGktMjAyNg==',
  },
});
