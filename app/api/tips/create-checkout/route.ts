import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { stripe, APP_URL } from '@/lib/stripe'

const TIP_AMOUNTS = [100, 300, 500, 1000, 2000] // cents

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const fromUserId = Number(session.user.id)

  const { toAuthorId, amount, message } = await req.json()
  if (!toAuthorId || !amount) return Response.json({ error: 'Missing fields' }, { status: 400 })

  const cents = Number(amount)
  if (cents < 50 || cents > 100_000) {
    return Response.json({ error: 'Amount must be between $0.50 and $1,000' }, { status: 400 })
  }

  const author = await prisma.user.findUnique({
    where: { id: Number(toAuthorId) },
    select: { id: true, username: true, email: true },
  })
  if (!author) return Response.json({ error: 'Author not found' }, { status: 404 })
  if (author.id === fromUserId) return Response.json({ error: 'Cannot tip yourself' }, { status: 400 })

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: cents,
          product_data: {
            name: `Tip for ${author.username}`,
            description: message?.trim() ? `"${message.trim()}"` : `Support ${author.username}'s writing`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type:        'tip',
      fromUserId:  String(fromUserId),
      toAuthorId:  String(author.id),
      message:     message?.trim() ?? '',
    },
    success_url: `${APP_URL}/profile/${author.id}?tip=success`,
    cancel_url:  `${APP_URL}/profile/${author.id}`,
  })

  return Response.json({ url: checkoutSession.url })
}
