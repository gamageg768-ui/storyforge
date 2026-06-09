import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = Number(session.user.id)
  const id     = Number(params.id)
  const { note, color } = await req.json()

  const existing = await prisma.userHighlight.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.userHighlight.update({
    where: { id },
    data: {
      ...(note  !== undefined ? { note  } : {}),
      ...(color !== undefined ? { color } : {}),
    },
  })
  return Response.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = Number(session.user.id)
  const id     = Number(params.id)

  const existing = await prisma.userHighlight.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.userHighlight.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
