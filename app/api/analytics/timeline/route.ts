import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? '30d'

  const now  = new Date()
  let startDate: Date | undefined
  if (period === '30d') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  if (period === '90d') startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  // 'all' has no startDate

  const chapters = await prisma.chapter.findMany({
    where: { authorId: userId },
    select: { id: true },
  })
  const chapterIds = chapters.map(c => c.id)

  if (chapterIds.length === 0) {
    return Response.json({ points: [], peak: 0, total: 0 })
  }

  const views = await prisma.chapterView.findMany({
    where: {
      chapterId: { in: chapterIds },
      ...(startDate ? { viewedAt: { gte: startDate } } : {}),
    },
    select: { viewedAt: true },
  })

  // Group by date string
  const byDate: Record<string, number> = {}
  for (const v of views) {
    const key = v.viewedAt.toISOString().slice(0, 10)
    byDate[key] = (byDate[key] ?? 0) + 1
  }

  // Fill gaps
  const points: { date: string; count: number }[] = []
  if (views.length > 0 || startDate) {
    const from   = startDate ?? new Date(Math.min(...views.map(v => v.viewedAt.getTime())))
    const cursor = new Date(from)
    cursor.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(0, 0, 0, 0)
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10)
      points.push({ date: key, count: byDate[key] ?? 0 })
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  const peak  = points.reduce((m, p) => Math.max(m, p.count), 0)
  const total = points.reduce((s, p) => s + p.count, 0)

  return Response.json({ points, peak, total })
}
