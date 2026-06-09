'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StoryCard from '@/components/StoryCard'

export default function SeriesDetailPage({ params }: { params: { seriesId: string } }) {
  const [series,  setSeries]  = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/series/${params.seriesId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => { setSeries(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.seriesId])

  if (loading) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500">Loading…</div>
    </main>
  )
  if (!series) return notFound()

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-2">
          <Link href="/series" className="text-gray-500 hover:text-gray-300 text-sm transition">← All Series</Link>
        </div>

        <h1 className="font-playfair text-3xl font-bold text-white mb-2">{series.title}</h1>
        {series.description && (
          <p className="text-gray-400 mb-4">{series.description}</p>
        )}

        <div className="flex items-center gap-2 mb-8">
          <Link href={`/profile/${series.author.id}`} className="flex items-center gap-2 hover:opacity-80 transition">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: series.author.avatarColor }}
            >
              {series.author.username[0].toUpperCase()}
            </span>
            <span className="text-gray-300 text-sm">{series.author.username}</span>
          </Link>
          <span className="text-gray-600 text-sm">• {series.stories.length} stories</span>
        </div>

        {series.stories.length === 0 ? (
          <p className="text-gray-500 text-sm">No stories in this series yet.</p>
        ) : (
          <div className="space-y-4">
            {series.stories.map((entry: any, i: number) => {
              const s = entry.story
              const story = {
                id:           s.id,
                title:        s.title,
                description:  s.description ?? '',
                genre:        s.genre,
                authorId:     s.authorId,
                authorName:   s.author?.username ?? '',
                authorColor:  s.author?.avatarColor ?? '#6366f1',
                status:       s.status,
                coverColor:   s.coverColor,
                coverImage:   s.coverImage,
                tags:         s.tags ?? '',
                createdAt:    s.createdAt,
                updatedAt:    s.updatedAt,
                chapterCount: s._count?.chapters,
                reactionCount: s._count?.reactions,
              }
              return (
                <div key={entry.id} className="flex gap-4 items-start">
                  <span className="text-gray-600 text-sm font-mono w-6 shrink-0 pt-2">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <StoryCard story={story as any} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
