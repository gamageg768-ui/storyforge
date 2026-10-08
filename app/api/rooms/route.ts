import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const hostId = Number(session.user.id)

  const { storyId, chapterId } = await req.json()
  if (!storyId || !chapterId) return Response.json({ error: 'storyId and chapterId required' }, { status: 400 })

  // Close any existing active rooms hosted by this user for this chapter
  await prisma.readingRoom.updateMany({
    where: { hostId, chapterId: Number(chapterId), isActive: true },
    data: { isActive: false },
  })

  let code = generateCode()
  let attempts = 0
  while (attempts < 5) {
    const exists = await prisma.readingRoom.findUnique({ where: { code } })
    if (!exists) break
    code = generateCode()
    attempts++
  }

  const room = await prisma.readingRoom.create({
    data: {
      code,
      storyId:   Number(storyId),
      chapterId: Number(chapterId),
      hostId,
      participants: { create: { userId: hostId, cursorParagraph: 0 } },
    },
  })

  return Response.json({ code: room.code, roomId: room.id })
}
