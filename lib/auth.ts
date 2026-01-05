import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { organization: true },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization?.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.organizationId = token.organizationId as string | null;
        session.user.organizationName = token.organizationName as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface User {
    id: string;
    role: UserRole;
    organizationId?: string | null;
    organizationName?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      organizationId?: string | null;
      organizationName?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    organizationId?: string | null;
    organizationName?: string;
  }
}

// Permission helpers
export function canViewInternalComments(role: UserRole): boolean {
  return role === UserRole.LAWYER || role === UserRole.ADMIN;
}

export function canApproveDocuments(role: UserRole): boolean {
  return role === UserRole.LAWYER || role === UserRole.ADMIN;
}

export function canManageUsers(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function canEditIssues(role: UserRole): boolean {
  return role === UserRole.LAWYER || role === UserRole.ADMIN;
}

export function canRerunAnalysis(role: UserRole): boolean {
  return role === UserRole.LAWYER || role === UserRole.ADMIN;
}
