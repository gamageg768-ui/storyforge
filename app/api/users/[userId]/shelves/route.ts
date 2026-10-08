import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  const userId = Number(params.userId)

  const shelves = await prisma.shelf.findMany({
    where: { userId, isPublic: true },
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
