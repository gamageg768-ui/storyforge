import { notFound } from 'next/navigation'
import ChapterReaderClient from './ChapterReaderClient'

async function getChapter(storyId: string, chapterId: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/stories/${storyId}/chapters/${chapterId}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function ChapterPage({ params }: { params: { storyId: string; chapterId: string } }) {
  const chapter = await getChapter(params.storyId, params.chapterId)
  if (!chapter) notFound()

  return <ChapterReaderClient chapter={chapter} storyId={Number(params.storyId)} />
}
