import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getOrCreateSystemUser } from "@energismart/shared";
import { env } from "~/env.js";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        // Create or update user in @energismart/shared Redis
        await getOrCreateSystemUser({
          id: user.id ?? "",
          email: user.email,
          name: user.name ?? user.email,
          image: user.image ?? undefined,
        });
        return true;
      }
      return false;
    },
    async session({ session, token }) {
      // Include user ID in the session
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: env.AUTH_SECRET,
});
