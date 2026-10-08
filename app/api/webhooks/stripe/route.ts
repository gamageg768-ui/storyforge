import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const meta = session.metadata ?? {}

      if (meta.type === 'tip') {
        await prisma.tipTransaction.upsert({
          where:  { stripeSessionId: session.id },
          create: {
            fromUserId:     Number(meta.fromUserId),
            toAuthorId:     Number(meta.toAuthorId),
            amount:         session.amount_total ?? 0,
            currency:       session.currency ?? 'usd',
            message:        meta.message ?? '',
            stripeSessionId: session.id,
            status:         'completed',
          },
          update: { status: 'completed' },
        })
      }

      if (meta.type === 'supporter_subscription') {
        const subId = session.subscription as string
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          await prisma.supporterSubscription.upsert({
            where:  { stripeSubscriptionId: subId },
            create: {
              userId:               Number(meta.userId),
              tierId:               Number(meta.tierId),
              stripeSubscriptionId: subId,
              stripeCustomerId:     String(session.customer),
              status:               sub.status,
              currentPeriodEnd:     new Date((sub as any).current_period_end * 1000),
            },
            update: {
              status:           sub.status,
              currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
            },
          })
        }
      }
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await prisma.supporterSubscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data:  {
          status:           sub.status,
          currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
        },
      })
      break
    }
  }

  return Response.json({ received: true })
}
