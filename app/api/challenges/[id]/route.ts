import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)

  const challenge = await prisma.readingChallenge.findUnique({
    where: { id },
    include: {
      _count: { select: { entries: true } },
      entries: {
        include: { user: { select: { username: true, avatarColor: true } } },
        orderBy: { progress: 'desc' },
        take: 20,
      },
    },
  })

  if (!challenge) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(challenge)
}
