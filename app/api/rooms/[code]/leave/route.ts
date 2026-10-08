import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(_req: Request, { params }: { params: { code: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const room = await prisma.readingRoom.findUnique({
    where: { code: params.code.toUpperCase() },
    select: { id: true, hostId: true },
  })
  if (!room) return Response.json({ error: 'Not found' }, { status: 404 })

  if (room.hostId === userId) {
    // Host closing the room — mark inactive
    await prisma.readingRoom.update({ where: { id: room.id }, data: { isActive: false } })
  } else {
    await prisma.readingRoomParticipant.deleteMany({ where: { roomId: room.id, userId } })
  }

  return Response.json({ ok: true })
}
