import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function requireAdmin(session: any) {
  if (!session) return false
  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { isAdmin: true },
  })
  return !!user?.isAdmin
}

export async function GET(req: Request) {
  const session = await auth()
  if (!await requireAdmin(session)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')

  const users = await prisma.user.findMany({
    where: search ? { username: { contains: search, mode: 'insensitive' } } : undefined,
    select: {
      id: true, username: true, email: true, avatarColor: true,
      isAdmin: true, isBanned: true, createdAt: true,
      _count: { select: { stories: true, followers: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return Response.json(users)
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!await requireAdmin(session)) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const adminId = Number(session!.user.id)

  const { userId, isBanned } = await req.json()
  if (!userId || typeof isBanned !== 'boolean') {
    return Response.json({ error: 'userId and isBanned required' }, { status: 400 })
  }
  if (Number(userId) === adminId) {
    return Response.json({ error: 'Cannot ban yourself' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: Number(userId) },
    data: { isBanned },
    select: { id: true, username: true, isBanned: true },
  })
  return Response.json(user)
}
