import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: Request, { params }: { params: { shelfId: string } }) {
  const shelfId = Number(params.shelfId)

  const shelf = await prisma.shelf.findUnique({
    where: { id: shelfId },
    include: {
      user: { select: { username: true, avatarColor: true } },
      stories: {
        include: {
          story: {
            include: {
              author: { select: { username: true, avatarColor: true } },
              _count: { select: { chapters: true, reactions: true } },
              ratings: { select: { rating: true } },
            },
          },
        },
        orderBy: { addedAt: 'desc' },
      },
      _count: { select: { stories: true } },
    },
  })

  if (!shelf) return Response.json({ error: 'Not found' }, { status: 404 })

  const session = await auth()
  const userId = session ? Number(session.user.id) : null
  if (!shelf.isPublic && shelf.userId !== userId) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json(shelf)
}

export async function PUT(req: Request, { params }: { params: { shelfId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId  = Number(session.user.id)
  const shelfId = Number(params.shelfId)

  const shelf = await prisma.shelf.findUnique({ where: { id: shelfId }, select: { userId: true } })
  if (!shelf || shelf.userId !== userId) return Response.json({ error: 'Not found' }, { status: 404 })

  const { title, description, isPublic } = await req.json()
  const updated = await prisma.shelf.update({
    where: { id: shelfId },
    data: {
      ...(title !== undefined        && { title: title.trim() }),
      ...(description !== undefined  && { description: description.trim() }),
      ...(isPublic !== undefined     && { isPublic }),
    },
  })

  return Response.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { shelfId: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId  = Number(session.user.id)
  const shelfId = Number(params.shelfId)

  const shelf = await prisma.shelf.findUnique({ where: { id: shelfId }, select: { userId: true } })
  if (!shelf || shelf.userId !== userId) return Response.json({ error: 'Not found' }, { status: 404 })

  await prisma.shelf.delete({ where: { id: shelfId } })
  return Response.json({ success: true })
}
