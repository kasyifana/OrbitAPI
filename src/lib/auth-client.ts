import { createAuthClient } from '@neondatabase/auth';

export const authClient = createAuthClient(
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
);
