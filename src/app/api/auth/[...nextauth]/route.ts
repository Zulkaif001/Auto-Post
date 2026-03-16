import NextAuth, { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "linkedin",
      name: "LinkedIn",
      type: "oauth",
      authorization: {
        url: "https://www.linkedin.com/oauth/v2/authorization",
        params: {
          scope: "openid profile email w_member_social",
          response_type: "code",
        },
      },
      token: {
        url: "https://www.linkedin.com/oauth/v2/accessToken",
      },
      userinfo: {
        url: "https://api.linkedin.com/v2/userinfo",
      },
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.linkedinId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).linkedinId = token.linkedinId;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
