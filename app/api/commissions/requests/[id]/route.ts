import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const VALID_STATUSES = ['pending', 'accepted', 'declined', 'delivered']

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)
  const id     = Number(params.id)

  const request = await prisma.commissionRequest.findUnique({ where: { id } })
  if (!request) return Response.json({ error: 'Not found' }, { status: 404 })
  if (request.authorId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { status, authorNote } = await req.json()
  if (status && !VALID_STATUSES.includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updated = await prisma.commissionRequest.update({
    where: { id },
    data: {
      ...(status     !== undefined && { status }),
      ...(authorNote !== undefined && { authorNote: authorNote.trim() }),
    },
  })

  return Response.json(updated)
}
