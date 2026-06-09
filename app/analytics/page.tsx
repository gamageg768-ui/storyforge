'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import ViewsLineChart from '@/components/ViewsLineChart'

interface StoryStats {
  id:            number
  title:         string
  coverColor:    string
  coverImage:    string | null
  genre:         string
  status:        string
  totalViews:    number
  reactionCount: number
  commentCount:  number
  ratingCount:   number
  avgRating:     number | null
  chapters:      { id: number; title: string; order: number; views: number }[]
}

interface Totals {
  totalViews:     number
  totalStories:   number
  followerCount:  number
  totalReactions: number
}

interface TimelineData {
  points: { date: string; count: number }[]
  peak:   number
  total:  number
}

type Period = '30d' | '90d' | 'all'

export default function AnalyticsPage() {
  const { isLoggedIn } = useAuth()
  const [stories,  setStories]  = useState<StoryStats[]>([])
  const [totals,   setTotals]   = useState<Totals | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [period,   setPeriod]   = useState<Period>('30d')
  const [timeline, setTimeline] = useState<TimelineData | null>(null)
  const [timelineLoading, setTimelineLoading] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) return
    fetch('/api/analytics')
      .then(r => r.json())
      .then(data => { setStories(data.stories); setTotals(data.totals); setLoading(false) })
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) return
    setTimelineLoading(true)
    fetch(`/api/analytics/timeline?period=${period}`)
      .then(r => r.json())
      .then((data: TimelineData) => { setTimeline(data); setTimelineLoading(false) })
  }, [isLoggedIn, period])

  if (!isLoggedIn) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Sign in to view analytics.</p>
    </main>
  )

  if (loading) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500">Loading analytics…</div>
    </main>
  )

  const statCard = (label: string, value: string | number, icon: string) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="text-gray-400 text-sm mt-0.5">{label}</div>
    </div>
  )

  const PERIOD_LABELS: Record<Period, string> = { '30d': '30 days', '90d': '90 days', all: 'All time' }

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="font-playfair text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-gray-400 mb-8">Overview of your stories' performance.</p>

        {/* Summary cards */}
        {totals && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {statCard('Total Views',     totals.totalViews,     '👁')}
            {statCard('Stories',         totals.totalStories,   '📖')}
            {statCard('Followers',       totals.followerCount,  '👥')}
            {statCard('Total Reactions', totals.totalReactions, '❤️')}
          </div>
        )}

        {/* Views Over Time chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Views Over Time</h2>
              {timeline && timeline.total > 0 && (
                <p className="text-gray-500 text-sm mt-0.5">
                  {timeline.total.toLocaleString()} views · peak {timeline.peak.toLocaleString()} in a day
                </p>
              )}
            </div>
            <div className="flex gap-1">
              {(['30d', '90d', 'all'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    period === p ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white bg-gray-800'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          {timelineLoading ? (
            <div className="h-48 bg-gray-800 rounded-lg animate-pulse" />
          ) : timeline ? (
            <ViewsLineChart points={timeline.points} peak={timeline.peak} />
          ) : null}
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">📊</p>
            <p>No stories yet. <Link href="/write" className="text-indigo-400 hover:underline">Write your first story</Link></p>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map(s => (
              <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  className="w-full text-left p-5 flex items-center gap-4 hover:bg-gray-800/50 transition"
                >
                  {/* Cover */}
                  <div
                    className="w-10 h-14 rounded shrink-0"
                    style={{ background: `linear-gradient(135deg, ${s.coverColor}cc, ${s.coverColor}55)` }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-white truncate">{s.title}</p>
                      <span className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded capitalize shrink-0">{s.genre}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>👁 {s.totalViews.toLocaleString()} views</span>
                      <span>❤️ {s.reactionCount} reactions</span>
                      <span>💬 {s.commentCount} comments</span>
                      {s.avgRating && <span>⭐ {s.avgRating.toFixed(1)}</span>}
                    </div>
                  </div>

                  {/* Bar chart */}
                  <div className="hidden md:flex items-end gap-1 h-10 shrink-0">
                    {s.chapters.slice(0, 12).map(ch => {
                      const maxV = Math.max(...s.chapters.map(c => c.views), 1)
                      const h = Math.max(4, (ch.views / maxV) * 40)
                      return (
                        <div key={ch.id} title={`Ch.${ch.order}: ${ch.views} views`}
                          className="w-2 bg-indigo-500/60 rounded-t" style={{ height: `${h}px` }} />
                      )
                    })}
                  </div>

                  <span className="text-gray-600 ml-2 shrink-0">{expanded === s.id ? '▲' : '▼'}</span>
                </button>

                {expanded === s.id && (
                  <div className="border-t border-gray-800 p-5">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Chapter Breakdown</h3>
                    <div className="space-y-2">
                      {s.chapters.map(ch => {
                        const maxV = Math.max(...s.chapters.map(c => c.views), 1)
                        const pct  = (ch.views / maxV) * 100
                        return (
                          <div key={ch.id} className="flex items-center gap-3">
                            <span className="text-gray-500 text-xs w-6 shrink-0">{ch.order}</span>
                            <span className="text-gray-300 text-sm flex-1 truncate">{ch.title}</span>
                            <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden shrink-0">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-gray-400 text-xs w-12 text-right shrink-0">{ch.views.toLocaleString()}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Link href={`/stories/${s.id}`}
                        className="text-xs text-indigo-400 hover:underline">View story →</Link>
                      <Link href={`/write/${s.id}`}
                        className="text-xs text-gray-400 hover:text-white hover:underline ml-4">Edit →</Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
