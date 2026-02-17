import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { ALLOWED_EMAIL_DOMAIN } from './constants';

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        return false; // reject non-miro.com emails
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
});
