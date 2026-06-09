import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, bio: true, avatarColor: true },
  })
  return Response.json(user)
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const { username, bio, avatarColor } = await req.json()

  if (username) {
    const taken = await prisma.user.findFirst({
      where: { username, id: { not: userId } },
    })
    if (taken) return Response.json({ error: 'Username already taken' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(username    ? { username }    : {}),
      ...(bio         !== undefined ? { bio }         : {}),
      ...(avatarColor ? { avatarColor } : {}),
    },
    select: { username: true, bio: true, avatarColor: true },
  })
  return Response.json(updated)
}
