import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)
  const { bio } = await req.json()
  const updated = await prisma.user.update({ where: { id: userId }, data: { bio } })
  return Response.json({ id: updated.id, bio: updated.bio })
}
