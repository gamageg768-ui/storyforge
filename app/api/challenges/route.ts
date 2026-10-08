import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const now = new Date()

  const challenges = await prisma.readingChallenge.findMany({
    where: { endDate: { gte: now } },
    include: { _count: { select: { entries: true } } },
    orderBy: { startDate: 'asc' },
  })

  const session = await auth()
  if (!session) return Response.json(challenges.map(c => ({ ...c, userEntry: null })))

  const userId = Number(session.user.id)
  const entries = await prisma.challengeEntry.findMany({
    where: { userId, challengeId: { in: challenges.map(c => c.id) } },
  })
  const entryMap = Object.fromEntries(entries.map(e => [e.challengeId, e]))

  return Response.json(challenges.map(c => ({ ...c, userEntry: entryMap[c.id] ?? null })))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { title, description, goal, goalType, startDate, endDate } = await req.json()
  if (!title || !goal || !goalType || !startDate || !endDate) {
    return Response.json({ error: 'Missing fields' }, { status: 400 })
  }

  const challenge = await prisma.readingChallenge.create({
    data: { title, description: description ?? '', goal: Number(goal), goalType, startDate: new Date(startDate), endDate: new Date(endDate) },
  })

  return Response.json(challenge, { status: 201 })
}
