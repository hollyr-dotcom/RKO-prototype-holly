import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { ALLOWED_EMAIL_DOMAIN } from './constants';

const isConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.AUTH_SECRET);

const authResult = isConfigured
  ? NextAuth({
      trustHost: true,
      providers: [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          authorization: {
            params: { hd: ALLOWED_EMAIL_DOMAIN },
          },
        }),
      ],
      callbacks: {
        signIn({ user }) {
          const email = user.email?.toLowerCase();
          if (!email || !email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
            return false;
          }
          return true;
        },
        jwt({ token, user }) {
          if (user?.id) token.id = user.id;
          return token;
        },
        session({ session, token }) {
          if (session.user && token.id) {
            session.user.id = token.id as string;
          }
          return session;
        },
      },
    })
  : {
      handlers: {
        GET: () => new Response('Auth not configured', { status: 503 }),
        POST: () => new Response('Auth not configured', { status: 503 }),
      },
      auth: async () => null,
      signIn: async () => { throw new Error('Auth not configured'); },
      signOut: async () => { throw new Error('Auth not configured'); },
    };

export const { handlers, auth, signIn, signOut } = authResult as ReturnType<typeof NextAuth>;
