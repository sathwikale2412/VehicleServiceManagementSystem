import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: 'user' | 'admin';
    sessionVersion?: number;
    csrfToken?: string;
  }
}
