import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/hash'

export async function POST() {
  await prisma.user.upsert({
    where:  { email: 'demo@storyforge.app' },
    update: {},
    create: {
      username: 'DemoUser',
      email:    'demo@storyforge.app',
      passwordHash: hashPassword('demo1234'),
      avatarColor:  '#10b981',
      bio: 'Just here to explore stories!',
    },
  })
  return Response.json({ email: 'demo@storyforge.app', password: 'demo1234' })
}
