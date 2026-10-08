import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { stripe, APP_URL } from '@/lib/stripe'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const { authorId } = await req.json()
  if (!authorId) return Response.json({ error: 'authorId required' }, { status: 400 })
  if (Number(authorId) === userId) return Response.json({ error: 'Cannot subscribe to yourself' }, { status: 400 })

  const tier = await prisma.supporterTier.findUnique({
    where: { authorId: Number(authorId) },
    select: { id: true, stripePriceId: true, isActive: true },
  })
  if (!tier || !tier.isActive) return Response.json({ error: 'Supporter tier not found or inactive' }, { status: 404 })

  // Check not already subscribed
  const existing = await prisma.supporterSubscription.findFirst({
    where: { userId, tierId: tier.id, status: { in: ['active', 'past_due'] } },
  })
  if (existing) return Response.json({ error: 'Already subscribed' }, { status: 409 })

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: tier.stripePriceId, quantity: 1 }],
    customer_email: user!.email,
    metadata: {
      type:     'supporter_subscription',
      userId:   String(userId),
      tierId:   String(tier.id),
      authorId: String(authorId),
    },
    success_url: `${APP_URL}/profile/${authorId}?subscribed=1`,
    cancel_url:  `${APP_URL}/profile/${authorId}`,
  })

  return Response.json({ url: checkoutSession.url })
}
