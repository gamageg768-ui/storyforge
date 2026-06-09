'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SeriesEntry {
  id:          number
  title:       string
  description: string
  authorId:    number
  createdAt:   string
  author:      { id: number; username: string; avatarColor: string }
  stories:     { order: number; story: { id: number; title: string; coverColor: string; coverImage?: string; genre: string } }[]
}

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState<SeriesEntry[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    fetch('/api/series')
      .then(r => r.json())
      .then(data => { setSeriesList(data); setLoading(false) })
  }, [])

  if (loading) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500">Loading series…</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="font-playfair text-3xl font-bold text-white mb-2">Story Series</h1>
        <p className="text-gray-400 mb-8">Multi-story collections grouped by their authors.</p>

        {seriesList.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">📚</p>
            <p>No series yet. Authors can create series from their write dashboard.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {seriesList.map(s => (
              <Link key={s.id} href={`/series/${s.id}`}
                className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-6 transition group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-playfair text-xl font-bold text-white group-hover:text-indigo-300 transition mb-1">
                      {s.title}
                    </h2>
                    {s.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{s.description}</p>
                    )}
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: s.author.avatarColor }}
                      >
                        {s.author.username[0].toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">{s.author.username}</span>
                      <span className="text-gray-600 text-xs">• {s.stories.length} stories</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {s.stories.slice(0, 5).map(ss => (
                        <span key={ss.story.id}
                          className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ss.story.coverColor }} />
                          {ss.story.title}
                        </span>
                      ))}
                      {s.stories.length > 5 && (
                        <span className="text-xs text-gray-500 px-2 py-1">+{s.stories.length - 5} more</span>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-600 group-hover:text-gray-400 transition text-xl">›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
