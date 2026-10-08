import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const authorId = searchParams.get('authorId')
  if (!authorId) return Response.json({ isSubscriber: false })

  const session = await auth()
  if (!session) return Response.json({ isSubscriber: false })
  const userId = Number(session.user.id)

  const sub = await prisma.supporterSubscription.findFirst({
    where: {
      userId,
      tier: { authorId: Number(authorId) },
      status: { in: ['active', 'past_due'] },
      currentPeriodEnd: { gt: new Date() },
    },
  })

  return Response.json({ isSubscriber: !!sub })
}
