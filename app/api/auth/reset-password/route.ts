import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/hash'

export async function POST(req: Request) {
  const { token, password } = await req.json()
  if (!token || !password) return Response.json({ error: 'Token and password required' }, { status: 400 })
  if (password.length < 6) return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })

  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    return Response.json({ error: 'Invalid or expired reset link' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: hashPassword(password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
  ])

  return Response.json({ success: true })
}
