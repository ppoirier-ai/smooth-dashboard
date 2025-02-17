import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SigninMessage } from "@/lib/auth/SigninMessage";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Solana",
      credentials: {
        message: {
          label: "Message",
          type: "text",
        },
        signature: {
          label: "Signature",
          type: "text",
        },
        publicKey: {
          label: "Public Key",
          type: "text",
        },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.message || !credentials?.signature || !credentials?.publicKey) {
            throw new Error("Missing credentials");
          }

          const signinMessage = new SigninMessage(
            JSON.parse(credentials.message)
          );
          const verified = signinMessage.verify(
            credentials.signature,
            credentials.publicKey
          );

          if (!verified) {
            throw new Error("Invalid signature");
          }

          console.log('Attempting to create/update user with publicKey:', credentials.publicKey);

          // Create or update user in database
          const user = await prisma.user.upsert({
            where: { 
              id: credentials.publicKey 
            },
            update: {
              lastLogin: new Date(),
              name: `${credentials.publicKey.slice(0, 4)}...${credentials.publicKey.slice(-4)}`,
            },
            create: {
              id: credentials.publicKey,
              email: `${credentials.publicKey}@phantom.wallet`,
              name: `${credentials.publicKey.slice(0, 4)}...${credentials.publicKey.slice(-4)}`,
              passwordHash: '',
              lastLogin: new Date(),
            },
          });

          console.log('User after upsert:', user);

          return {
            id: credentials.publicKey,
            name: user.name,
            email: user.email,
          };
        } catch (e) {
          console.error("Authorization error:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.publicKey = user.id;
        // Ensure the user exists in the database
        await prisma.user.upsert({
          where: { id: user.id },
          update: { lastLogin: new Date() },
          create: {
            id: user.id,
            email: `${user.id}@phantom.wallet`,
            name: user.name || `${user.id.slice(0, 4)}...${user.id.slice(-4)}`,
            passwordHash: '',
            lastLogin: new Date(),
          },
        });
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.publicKey as string;
        session.user.publicKey = token.publicKey as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log('SignIn event for user:', user);
    },
  },
  pages: {
    signIn: '/login',
  },
  debug: true, // Enable debug logs
}; 