import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const chapterId = Number(searchParams.get('chapterId'))
  if (!chapterId) return Response.json({ error: 'chapterId required' }, { status: 400 })

  const userId = Number(session.user.id)
  const highlights = await prisma.userHighlight.findMany({
    where: { userId, chapterId },
    orderBy: { createdAt: 'asc' },
  })
  return Response.json(highlights)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = Number(session.user.id)
  const { chapterId, storyId, paragraphIndex, selectedText, note, color } = await req.json()
  if (!chapterId || !storyId || paragraphIndex == null || !selectedText) {
    return Response.json({ error: 'Missing fields' }, { status: 400 })
  }

  const highlight = await prisma.userHighlight.create({
    data: {
      userId,
      chapterId,
      storyId,
      paragraphIndex,
      selectedText: selectedText.slice(0, 500),
      note:  note  ?? '',
      color: color ?? 'yellow',
    },
  })
  return Response.json(highlight, { status: 201 })
}
