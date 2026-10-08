import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId      = Number(session.user.id)
  const challengeId = Number(params.id)

  const challenge = await prisma.readingChallenge.findUnique({ where: { id: challengeId } })
  if (!challenge) return Response.json({ error: 'Not found' }, { status: 404 })
  if (new Date() > challenge.endDate) return Response.json({ error: 'Challenge ended' }, { status: 400 })

  const entry = await prisma.challengeEntry.upsert({
    where:  { userId_challengeId: { userId, challengeId } },
    create: { userId, challengeId, progress: 0 },
    update: {},
  })

  return Response.json(entry)
}
