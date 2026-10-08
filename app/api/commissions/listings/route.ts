import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const authorId = searchParams.get('authorId')

  const where = authorId
    ? { authorId: Number(authorId) }
    : { isOpen: true }

  const listings = await prisma.commissionListing.findMany({
    where,
    include: {
      author: { select: { id: true, username: true, avatarColor: true } },
      _count:  { select: { requests: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return Response.json(listings)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const authorId = Number(session.user.id)

  const existing = await prisma.commissionListing.findUnique({ where: { authorId } })
  if (existing) return Response.json({ error: 'Listing already exists — use PUT to update' }, { status: 409 })

  const { title, description, priceMin, priceMax, genres, turnaround } = await req.json()
  if (!title?.trim() || !description?.trim()) {
    return Response.json({ error: 'title and description required' }, { status: 400 })
  }

  const listing = await prisma.commissionListing.create({
    data: {
      authorId,
      title:       title.trim(),
      description: description.trim(),
      priceMin:    Number(priceMin ?? 0),
      priceMax:    Number(priceMax ?? 0),
      genres:      genres?.trim() ?? '',
      turnaround:  turnaround?.trim() ?? '',
    },
  })

  return Response.json(listing, { status: 201 })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const authorId = Number(session.user.id)

  const listing = await prisma.commissionListing.findUnique({ where: { authorId } })
  if (!listing) return Response.json({ error: 'No listing found' }, { status: 404 })

  const { title, description, priceMin, priceMax, genres, turnaround, isOpen } = await req.json()

  const updated = await prisma.commissionListing.update({
    where: { authorId },
    data: {
      ...(title       !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(priceMin    !== undefined && { priceMin: Number(priceMin) }),
      ...(priceMax    !== undefined && { priceMax: Number(priceMax) }),
      ...(genres      !== undefined && { genres: genres.trim() }),
      ...(turnaround  !== undefined && { turnaround: turnaround.trim() }),
      ...(isOpen      !== undefined && { isOpen }),
    },
  })

  return Response.json(updated)
}

export async function DELETE(_req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const authorId = Number(session.user.id)

  await prisma.commissionListing.deleteMany({ where: { authorId } })
  return Response.json({ success: true })
}
