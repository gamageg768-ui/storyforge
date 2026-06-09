import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/hash'
import { AVATAR_COLORS } from '@/types'

export async function POST(req: Request) {
  const { username, email, password } = await req.json()

  if (!username || !email || !password) {
    return Response.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (password.length < 6) {
    return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  })
  if (existing) {
    return Response.json({ error: 'Email or username already taken' }, { status: 409 })
  }

  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash: hashPassword(password),
      avatarColor,
    },
  })

  return Response.json({ id: user.id, username: user.username, email: user.email })
}
