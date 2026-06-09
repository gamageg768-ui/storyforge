'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import StarRating from '@/components/StarRating'
import { Story } from '@/types'

type ReadingStory = Story & { readingStatus: string; readChapterCount?: number }

const STATUS_LABELS: Record<string, { label: string; icon: string; classes: string }> = {
  want_to_read: { label: 'Want to Read', icon: '🔖', classes: 'bg-amber-900/30 border-amber-700/50 text-amber-400' },
  reading:      { label: 'Reading',       icon: '📖', classes: 'bg-blue-900/30 border-blue-700/50 text-blue-400' },
  completed:    { label: 'Completed',     icon: '✅', classes: 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400' },
}

function LibraryCard({ story, onStatusChange, onRemove }: {
  story: ReadingStory
  onStatusChange: (id: number, status: string) => void
  onRemove: (id: number) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const sl = STATUS_LABELS[story.readingStatus] || STATUS_LABELS.want_to_read

  async function changeStatus(newStatus: string) {
    setMenuOpen(false)
    if (newStatus === 'remove') {
      await fetch('/api/social/reading-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: story.id }),
      })
      onRemove(story.id)
      return
    }
    const res = await fetch(`/api/social/reading-list/${story.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) onStatusChange(story.id, newStatus)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-4 group relative">
      {/* Cover */}
      <Link href={`/stories/${story.id}`}>
        <div
          className="w-16 h-20 rounded-lg flex items-end p-1.5 shrink-0"
          style={{
            background: `linear-gradient(135deg, ${story.coverColor}dd, ${story.coverColor}88)`,
            backgroundImage: `linear-gradient(135deg, ${story.coverColor}dd, ${story.coverColor}88), repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)`,
            backgroundSize: 'auto, 8px 8px',
          }}
        >
          <p className="text-white text-xs font-bold leading-tight line-clamp-3 font-playfair">{story.title}</p>
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/stories/${story.id}`} className="font-playfair font-semibold text-white hover:text-indigo-300 transition text-sm line-clamp-1">
          {story.title}
        </Link>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <p className="text-gray-500 text-xs">{story.authorName} · {story.genre}</p>
          {(story.chapterCount ?? 0) > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              (story.readChapterCount ?? 0) >= (story.chapterCount ?? 1)
                ? 'bg-emerald-900/40 text-emerald-400'
                : 'bg-gray-800 text-gray-400'
            }`}>
              Ch. {story.readChapterCount ?? 0}/{story.chapterCount}
            </span>
          )}
        </div>

        {(story.avgRating ?? 0) > 0 && (
          <div className="mt-1">
            <StarRating value={story.avgRating ?? 0} readonly size="sm" />
          </div>
        )}

        {/* Status dropdown */}
        <div className="relative mt-2 inline-block">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className={`text-xs px-2.5 py-1 rounded-full border ${sl.classes} flex items-center gap-1`}
          >
            {sl.icon} {sl.label} ▾
          </button>
          {menuOpen && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden w-44">
              {Object.entries(STATUS_LABELS).map(([key, val]) => (
                <button key={key} onClick={() => changeStatus(key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-700 transition ${story.readingStatus === key ? 'text-white font-medium' : 'text-gray-300'}`}>
                  {val.icon} {val.label}
                </button>
              ))}
              <div className="border-t border-gray-700">
                <button onClick={() => changeStatus('remove')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-gray-700 transition">
                  🗑 Remove from library
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Read button (hover) */}
      {(story.chapters?.length ?? story.chapterCount ?? 0) > 0 && (
        <Link href={`/stories/${story.id}`}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition">
          ▶ Read
        </Link>
      )}
    </div>
  )
}

export default function ReadingListPage() {
  const { isLoggedIn, status } = useAuth()
  const router = useRouter()
  const [stories,     setStories]     = useState<ReadingStory[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!isLoggedIn) return
    fetch('/api/users/me/reading-list')
      .then(r => r.json())
      .then(data => { setStories(data); setLoading(false) })
  }, [isLoggedIn])

  function handleStatusChange(id: number, newStatus: string) {
    setStories(prev => prev.map(s => s.id === id ? { ...s, readingStatus: newStatus as ReadingStory['readingStatus'] } : s))
  }

  function handleRemove(id: number) {
    setStories(prev => prev.filter(s => s.id !== id))
  }

  const counts = {
    all:          stories.length,
    reading:      stories.filter(s => s.readingStatus === 'reading').length,
    want_to_read: stories.filter(s => s.readingStatus === 'want_to_read').length,
    completed:    stories.filter(s => s.readingStatus === 'completed').length,
  }

  const filtered = filterStatus === 'all' ? stories : stories.filter(s => s.readingStatus === filterStatus)

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500">Loading library…</div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-playfair text-3xl font-bold text-white">📚 My Library</h1>
          <p className="text-gray-400 mt-1">Track your reading progress</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { key: 'all',          label: 'All',          count: counts.all,          icon: '📚' },
            { key: 'reading',      label: 'Reading',      count: counts.reading,      icon: '📖' },
            { key: 'want_to_read', label: 'Want to Read', count: counts.want_to_read, icon: '🔖' },
            { key: 'completed',    label: 'Completed',    count: counts.completed,    icon: '✅' },
          ].map(stat => (
            <button
              key={stat.key}
              onClick={() => setFilterStatus(stat.key)}
              className={`bg-gray-900 border rounded-xl p-4 text-left transition ${
                filterStatus === stat.key ? 'border-indigo-500' : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <p className="text-2xl font-bold text-white">{stat.count}</p>
              <p className="text-gray-400 text-sm">{stat.icon} {stat.label}</p>
            </button>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
          {['all', 'reading', 'want_to_read', 'completed'].map(key => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                filterStatus === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {key === 'all' ? 'All' : STATUS_LABELS[key]?.icon + ' ' + STATUS_LABELS[key]?.label}
            </button>
          ))}
        </div>

        <p className="text-gray-500 text-sm mb-4">{filtered.length} {filtered.length === 1 ? 'story' : 'stories'}</p>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">📚</p>
            <p>Your library is empty.</p>
            <Link href="/" className="mt-4 inline-block text-indigo-400 hover:underline text-sm">Discover stories →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(s => (
              <LibraryCard
                key={s.id}
                story={s}
                onStatusChange={handleStatusChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
