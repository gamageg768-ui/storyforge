import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { hashPassword } from './hash'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user) return null
        if (user.passwordHash !== hashPassword(credentials.password as string)) return null
        return {
          id:          String(user.id),
          name:        user.username,
          email:       user.email,
          avatarColor: user.avatarColor,
          bio:         user.bio,
          isAdmin:     user.isAdmin ?? false,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id          = user.id
        token.avatarColor = user.avatarColor
        token.bio         = user.bio
        token.name        = user.name
        token.isAdmin     = user.isAdmin
      }
      return token
    },
    session({ session, token }) {
      session.user.id          = token.id as string
      session.user.avatarColor = token.avatarColor as string
      session.user.bio         = token.bio as string
      session.user.name        = token.name as string
      session.user.isAdmin     = token.isAdmin as boolean
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
})
