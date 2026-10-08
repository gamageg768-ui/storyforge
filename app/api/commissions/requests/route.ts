import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET — returns requests received by author (or sent by reader with ?mine=1)
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const { searchParams } = new URL(req.url)
  const mine = searchParams.get('mine') === '1'

  if (mine) {
    const requests = await prisma.commissionRequest.findMany({
      where: { userId },
      include: { author: { select: { id: true, username: true, avatarColor: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return Response.json(requests)
  }

  // Author view: requests received
  const requests = await prisma.commissionRequest.findMany({
    where: { authorId: userId },
    include: { user: { select: { id: true, username: true, avatarColor: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json(requests)
}

// POST — submit a new commission request
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const { authorId, listingId, title, description, budget } = await req.json()
  if (!authorId || !title?.trim() || !description?.trim()) {
    return Response.json({ error: 'authorId, title and description required' }, { status: 400 })
  }
  if (Number(authorId) === userId) {
    return Response.json({ error: 'Cannot request a commission from yourself' }, { status: 400 })
  }

  const request = await prisma.commissionRequest.create({
    data: {
      userId,
      authorId:    Number(authorId),
      listingId:   listingId ? Number(listingId) : null,
      title:       title.trim(),
      description: description.trim(),
      budget:      Number(budget ?? 0),
    },
  })

  return Response.json(request, { status: 201 })
}
