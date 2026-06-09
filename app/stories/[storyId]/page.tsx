import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import StoryDetailClient from './StoryDetailClient'

async function getStory(storyId: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
    const res = await fetch(`${baseUrl}/api/stories/${storyId}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { storyId: string } }): Promise<Metadata> {
  const story = await prisma.story.findUnique({
    where: { id: Number(params.storyId) },
    include: { author: { select: { username: true } } },
  })
  if (!story) return { title: 'Story Not Found | StoryForge' }

  const title       = `${story.title} by ${story.author.username} | StoryForge`
  const description = story.description || `Read "${story.title}" by ${story.author.username} on StoryForge — ${story.genre} fiction.`

  return {
    title,
    description,
    openGraph: {
      title:       story.title,
      description,
      type:        'book',
      authors:     [story.author.username],
      ...(story.coverImage && { images: [{ url: story.coverImage, width: 400, height: 600 }] }),
    },
    twitter: {
      card:        story.coverImage ? 'summary_large_image' : 'summary',
      title:       story.title,
      description,
      ...(story.coverImage && { images: [story.coverImage] }),
    },
  }
}

export default async function StoryPage({ params }: { params: { storyId: string } }) {
  const story = await getStory(params.storyId)
  if (!story) notFound()
  return <StoryDetailClient story={story} />
}
