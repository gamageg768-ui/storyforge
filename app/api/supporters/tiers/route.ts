import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const authorId = searchParams.get('authorId')
  if (!authorId) return Response.json({ error: 'authorId required' }, { status: 400 })

  const tier = await prisma.supporterTier.findUnique({
    where: { authorId: Number(authorId) },
    include: { _count: { select: { subscriptions: { where: { status: 'active' } } } } },
  })

  return Response.json(tier ?? null)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const authorId = Number(session.user.id)

  const { name, description, priceMonthly, earlyAccessDays } = await req.json()
  if (!name || !priceMonthly) return Response.json({ error: 'name and priceMonthly required' }, { status: 400 })

  const cents = Math.round(Number(priceMonthly) * 100)
  if (cents < 100) return Response.json({ error: 'Minimum price is $1/month' }, { status: 400 })

  const existing = await prisma.supporterTier.findUnique({ where: { authorId } })
  if (existing) return Response.json({ error: 'Tier already exists — use PUT to update' }, { status: 409 })

  const author = await prisma.user.findUnique({ where: { id: authorId }, select: { username: true } })

  // Create Stripe product + price
  const product = await stripe.products.create({
    name: `${author!.username} — ${name}`,
    metadata: { authorId: String(authorId) },
  })
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: cents,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { authorId: String(authorId) },
  })

  const tier = await prisma.supporterTier.create({
    data: {
      authorId,
      name,
      description: description ?? '',
      priceMonthly: cents,
      earlyAccessDays: earlyAccessDays ? Number(earlyAccessDays) : 7,
      stripePriceId:   price.id,
      stripeProductId: product.id,
    },
  })

  return Response.json(tier, { status: 201 })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const authorId = Number(session.user.id)

  const { name, description, earlyAccessDays, isActive } = await req.json()

  const tier = await prisma.supporterTier.findUnique({ where: { authorId } })
  if (!tier) return Response.json({ error: 'No tier found' }, { status: 404 })

  const updated = await prisma.supporterTier.update({
    where: { authorId },
    data: {
      ...(name             !== undefined && { name }),
      ...(description      !== undefined && { description }),
      ...(earlyAccessDays  !== undefined && { earlyAccessDays: Number(earlyAccessDays) }),
      ...(isActive         !== undefined && { isActive }),
    },
  })

  // Sync name to Stripe product
  if (name) {
    const author = await prisma.user.findUnique({ where: { id: authorId }, select: { username: true } })
    await stripe.products.update(tier.stripeProductId, {
      name: `${author!.username} — ${name}`,
    }).catch(() => {})
  }

  return Response.json(updated)
}
