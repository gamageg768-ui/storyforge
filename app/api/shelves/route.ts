import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const shelves = await prisma.shelf.findMany({
    where: { userId },
    include: {
      stories: {
        include: { story: { select: { id: true, coverColor: true, coverImage: true } } },
        orderBy: { addedAt: 'desc' },
        take: 3,
      },
      _count: { select: { stories: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return Response.json(shelves)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const { title, description, isPublic } = await req.json()
  if (!title?.trim()) return Response.json({ error: 'Title required' }, { status: 400 })

  const shelf = await prisma.shelf.create({
    data: { userId, title: title.trim(), description: description?.trim() ?? '', isPublic: isPublic !== false },
  })

  return Response.json(shelf, { status: 201 })
}
