import { put } from '@vercel/blob'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })
  if (!file.type.startsWith('image/')) return Response.json({ error: 'File must be an image' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return Response.json({ error: 'Image must be under 5 MB' }, { status: 400 })

  const userId = session.user.id
  const ext = file.name.split('.').pop() || 'jpg'
  const blob = await put(`covers/${userId}-${Date.now()}.${ext}`, file, { access: 'public' })

  return Response.json({ url: blob.url })
}
