import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const NOTIFICATION_TYPES = ['new_chapter', 'new_comment', 'new_follower'] as const

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const stored = await prisma.notificationPreference.findMany({ where: { userId } })
  const byType: Record<string, { emailEnabled: boolean; inAppEnabled: boolean }> = {}
  for (const p of stored) byType[p.type] = { emailEnabled: p.emailEnabled, inAppEnabled: p.inAppEnabled }

  const prefs = NOTIFICATION_TYPES.map(type => ({
    type,
    emailEnabled:  byType[type]?.emailEnabled  ?? true,
    inAppEnabled:  byType[type]?.inAppEnabled  ?? true,
  }))

  return Response.json(prefs)
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = Number(session.user.id)

  const prefs: { type: string; emailEnabled: boolean; inAppEnabled: boolean }[] = await req.json()
  if (!Array.isArray(prefs)) return Response.json({ error: 'Invalid body' }, { status: 400 })

  await Promise.all(prefs.map(p =>
    prisma.notificationPreference.upsert({
      where:  { userId_type: { userId, type: p.type } },
      create: { userId, type: p.type, emailEnabled: p.emailEnabled, inAppEnabled: p.inAppEnabled },
      update: { emailEnabled: p.emailEnabled, inAppEnabled: p.inAppEnabled },
    })
  ))

  return Response.json({ success: true })
}
