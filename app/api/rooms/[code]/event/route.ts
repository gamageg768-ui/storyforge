import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const room = await prisma.readingRoom.findUnique({
    where: { code: params.code.toUpperCase() },
    select: { id: true, isActive: true },
  })
  if (!room || !room.isActive) return Response.json({ error: 'Room not found' }, { status: 404 })

  const { type, paragraph, content } = await req.json()

  if (type === 'position' && paragraph !== undefined) {
    await prisma.readingRoomParticipant.update({
      where:  { roomId_userId: { roomId: room.id, userId } },
      data:   { cursorParagraph: Number(paragraph), lastSeen: new Date() },
    })
  } else if (type === 'chat' && content?.trim()) {
    await prisma.readingRoomMessage.create({
      data: { roomId: room.id, userId, content: content.trim().substring(0, 500) },
    })
  } else {
    return Response.json({ error: 'Invalid event' }, { status: 400 })
  }

  return Response.json({ ok: true })
}
