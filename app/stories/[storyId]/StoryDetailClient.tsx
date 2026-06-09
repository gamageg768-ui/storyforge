'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ReactionBar from '@/components/ReactionBar'
import CommentSection from '@/components/CommentSection'
import StarRating from '@/components/StarRating'
import StoryCard from '@/components/StoryCard'
import { Story } from '@/types'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function StoryDetailClient({ story: initialStory }: { story: Story }) {
  const { user, isLoggedIn } = useAuth()
  const router = useRouter()
  const [story,        setStory]        = useState(initialStory)
  const [inLibrary,    setInLibrary]    = useState(!!initialStory.inReadingList)
  const [userRating,   setUserRating]   = useState(initialStory.userRating ?? 0)
  const [avgRating,    setAvgRating]    = useState(initialStory.avgRating ?? 0)
  const [ratingCount,  setRatingCount]  = useState(initialStory.ratingCount ?? 0)
  const [collabUsername, setCollabUsername] = useState('')
  const [collabMsg,    setCollabMsg]    = useState('')
  const [adultDismissed,  setAdultDismissed]  = useState(false)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [reportReason,    setReportReason]    = useState('')
  const [reportSent,      setReportSent]      = useState(false)
  const [showReport,      setShowReport]      = useState(false)
  const [continueChapter, setContinueChapter] = useState<{ id: number; title: string; order: number } | null>(null)
  const [expandedSummary, setExpandedSummary] = useState<number | null>(null)
  const [tocCollapsed,    setTocCollapsed]    = useState(false)
  const [readProgress,    setReadProgress]    = useState<{ readCount: number; totalCount: number } | null>(null)

  const isOwner = isLoggedIn && Number(user?.id) === story.authorId

  // Load recommendations
  useEffect(() => {
    fetch(`/api/stories/${story.id}/recommendations`)
      .then(r => r.json())
      .then(data => setRecommendations(Array.isArray(data) ? data : []))
  }, [story.id])

  // Check reading progress
  useEffect(() => {
    if (!story.chapters) return
    try {
      for (const ch of story.chapters) {
        const saved = localStorage.getItem(`sf_pos_${ch.id}`)
        if (saved && Number(saved) > 100) {
          setContinueChapter({ id: ch.id, title: ch.title, order: ch.chapterOrder })
          break
        }
      }
    } catch {}
  }, [story.chapters])

  // Fetch server-side chapter read progress
  useEffect(() => {
    if (!isLoggedIn) return
    fetch(`/api/stories/${story.id}/progress`)
      .then(r => r.json())
      .then(data => {
        if (data.totalCount > 0) setReadProgress({ readCount: data.readCount, totalCount: data.totalCount })
      })
      .catch(() => {})
  }, [story.id, isLoggedIn])

  async function toggleLibrary() {
    if (!isLoggedIn) { router.push('/login'); return }
    const prev = inLibrary
    setInLibrary(!prev)
    const res = await fetch('/api/social/reading-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId: story.id }),
    })
    if (!res.ok) setInLibrary(prev)
  }

  async function handleRate(r: number) {
    if (!isLoggedIn) { router.push('/login'); return }
    const res = await fetch(`/api/stories/${story.id}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: r }),
    })
    if (res.ok) {
      const data = await res.json()
      setUserRating(data.userRating ?? 0)
      setAvgRating(data.avgRating ?? 0)
      setRatingCount(data.ratingCount)
    }
  }

  async function addCollaborator(e: React.FormEvent) {
    e.preventDefault()
    setCollabMsg('')
    const res = await fetch(`/api/stories/${story.id}/collaborators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: collabUsername, role: 'author' }),
    })
    if (res.ok) {
      setCollabMsg('Collaborator added!')
      setCollabUsername('')
      const updated = await fetch(`/api/stories/${story.id}`).then(r => r.json())
      setStory(updated)
    } else {
      const data = await res.json()
      setCollabMsg(data.error || 'Failed')
    }
  }

  async function removeCollaborator(userId: number) {
    if (!confirm('Remove this collaborator?')) return
    await fetch(`/api/stories/${story.id}/collaborators/${userId}`, { method: 'DELETE' })
    const updated = await fetch(`/api/stories/${story.id}`).then(r => r.json())
    setStory(updated)
  }

  async function sendReport(e: React.FormEvent) {
    e.preventDefault()
    if (!reportReason.trim()) return
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType: 'story', targetId: story.id, reason: reportReason }),
    })
    setReportSent(true)
    setShowReport(false)
  }

  const statusColors: Record<string, string> = {
    ongoing:   'bg-blue-900/40 text-blue-300 border border-blue-800/50',
    completed: 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50',
    hiatus:    'bg-amber-900/40 text-amber-300 border border-amber-800/50',
  }

  const warnings = story.contentWarnings ? story.contentWarnings.split(',').map(w => w.trim()).filter(Boolean) : []

  // Adult content gate
  if ((story as any).isAdult && !adultDismissed) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 border border-red-900/50 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🔞</div>
          <h2 className="font-playfair text-2xl font-bold text-white mb-2">Mature Content</h2>
          <p className="text-gray-400 mb-2">This story is marked as 18+ content.</p>
          {warnings.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center mb-4">
              {warnings.map(w => (
                <span key={w} className="bg-amber-900/40 text-amber-300 text-xs px-2 py-0.5 rounded-full">{w}</span>
              ))}
            </div>
          )}
          <p className="text-gray-500 text-sm mb-6">By continuing, you confirm you are 18 or older.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setAdultDismissed(true)}
              className="bg-red-900/50 hover:bg-red-900 border border-red-700 text-red-300 px-5 py-2 rounded-lg transition text-sm">
              I'm 18+ — Continue
            </button>
            <button onClick={() => router.back()}
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-5 py-2 rounded-lg transition text-sm">
              Go Back
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Hero banner */}
      <div className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${story.coverColor}66, ${story.coverColor}22)` }}>
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-8 items-start">
          {/* Book cover */}
          <div className="hidden lg:block w-40 h-52 rounded-xl shrink-0 shadow-2xl overflow-hidden">
            {(story as any).coverImage ? (
              <img src={(story as any).coverImage} alt={story.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-end p-3"
                style={{
                  background: `linear-gradient(135deg, ${story.coverColor}dd, ${story.coverColor}88)`,
                  backgroundImage: `linear-gradient(135deg, ${story.coverColor}dd, ${story.coverColor}88), repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)`,
                  backgroundSize: 'auto, 8px 8px',
                }}>
                <div>
                  <p className="font-playfair text-white text-sm font-bold leading-tight line-clamp-3">{story.title}</p>
                  <p className="text-white/70 text-xs mt-1">{story.authorName}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-black/30 text-white text-xs px-2 py-0.5 rounded-full">{story.genre}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[story.status] || ''}`}>
                {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
              </span>
              {(story as any).isAdult && (
                <span className="bg-red-900/50 text-red-300 text-xs px-2 py-0.5 rounded-full border border-red-800/50">18+</span>
              )}
              {warnings.map(w => (
                <span key={w} className="bg-amber-900/40 text-amber-300 text-xs px-2 py-0.5 rounded-full">{w}</span>
              ))}
            </div>

            <h1 className="font-playfair text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">{story.title}</h1>
            <p className="text-gray-300 text-base mb-4 max-w-2xl">{story.description}</p>

            {story.tags && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {story.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                  <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}
                    className="bg-white/10 hover:bg-indigo-500/30 text-white/80 hover:text-white text-xs px-2 py-0.5 rounded-full transition">
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mb-5">
              <Link href={`/profile/${story.authorId}`} className="flex items-center gap-2 hover:opacity-80 transition">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: story.authorColor }}>
                  {story.authorName[0].toUpperCase()}
                </span>
                <span className="text-white font-medium">{story.authorName}</span>
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 text-gray-300 text-sm mb-5">
              <span>📖 {story.chapters?.length ?? 0} chapters</span>
              {(story.totalWordCount ?? 0) > 0 && (
                <span>📝 {((story.totalWordCount ?? 0) / 1000).toFixed(1)}k words</span>
              )}
              {(story.estimatedReadMinutes ?? 0) > 0 && (
                <span>⏱ ~{story.estimatedReadMinutes! >= 60
                  ? `${(story.estimatedReadMinutes! / 60).toFixed(1)}h`
                  : `${story.estimatedReadMinutes}min`} read</span>
              )}
              <span>❤️ {story.reactionCount ?? 0} reactions</span>
              <span>💬 {story.commentCount ?? 0} comments</span>
              {avgRating > 0 && <span>⭐ {avgRating.toFixed(1)} ({ratingCount})</span>}
            </div>

            <div className="flex flex-wrap gap-2">
              {(story.chapters?.length ?? 0) > 0 && (
                <Link href={`/stories/${story.id}/chapters/${story.chapters![0].id}`}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition flex items-center gap-2">
                  ▶ Start Reading
                </Link>
              )}
              <button onClick={toggleLibrary}
                className={`px-4 py-2.5 rounded-lg border font-medium transition text-sm ${
                  inLibrary
                    ? 'bg-emerald-800/50 border-emerald-700 text-emerald-300'
                    : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}>
                {inLibrary ? '✅ In Library' : '+ Add to Library'}
              </button>
              {isOwner && (
                <Link href={`/write/${story.id}`}
                  className="bg-gray-800/50 border border-gray-600 hover:border-gray-500 text-gray-300 px-4 py-2.5 rounded-lg text-sm transition">
                  ✍️ Edit Story
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 xl:grid xl:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          {/* Continue Reading */}
          {continueChapter && (
            <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-indigo-400 mb-0.5">Resume where you left off</p>
                <p className="text-white text-sm font-medium">Ch. {continueChapter.order}: {continueChapter.title}</p>
              </div>
              <Link
                href={`/stories/${story.id}/chapters/${continueChapter.id}`}
                className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-1.5 rounded-lg transition font-medium"
              >
                Continue Reading
              </Link>
            </div>
          )}

          {/* Table of Contents */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => setTocCollapsed(c => !c)}
                  className="flex items-center gap-2 text-lg font-semibold text-white hover:text-indigo-300 transition shrink-0"
                >
                  <span className={`text-sm transition-transform ${tocCollapsed ? '' : 'rotate-90'}`}>›</span>
                  Table of Contents
                </button>
                {readProgress && readProgress.totalCount > 0 && (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden max-w-32">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${(readProgress.readCount / readProgress.totalCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">
                      {readProgress.readCount}/{readProgress.totalCount} read
                    </span>
                  </div>
                )}
              </div>
              {isOwner && (
                <Link href={`/write/${story.id}/chapter`}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-lg transition shrink-0">
                  + Add Chapter
                </Link>
              )}
            </div>
            {!tocCollapsed && (
              !story.chapters || story.chapters.length === 0 ? (
                <p className="text-gray-500 text-sm">No chapters yet.</p>
              ) : (
                <div className="flex flex-col divide-y divide-gray-800">
                  {story.chapters.map(ch => {
                    const hasSummary = !!(ch as any).summary
                    const isOpen     = expandedSummary === ch.id
                    return (
                      <div key={ch.id} className="py-2 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-2 group">
                          {hasSummary ? (
                            <button
                              onClick={() => setExpandedSummary(isOpen ? null : ch.id)}
                              className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-indigo-400 transition shrink-0"
                              title="Toggle summary"
                            >
                              <span className={`text-xs transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
                            </button>
                          ) : (
                            <span className="w-5 h-5 shrink-0" />
                          )}
                          <span className="text-gray-600 text-xs font-mono w-6 shrink-0">
                            {String(ch.chapterOrder).padStart(2, '0')}
                          </span>
                          <Link
                            href={`/stories/${story.id}/chapters/${ch.id}`}
                            className="flex-1 flex items-center gap-3 min-w-0 hover:text-white group-hover:text-indigo-300 transition"
                          >
                            <span className="text-gray-200 text-sm truncate">{ch.title}</span>
                            <span className="text-gray-600 text-xs shrink-0 ml-auto">{formatDate(ch.createdAt)}</span>
                          </Link>
                        </div>
                        {isOpen && hasSummary && (
                          <p className="text-gray-400 text-sm mt-1.5 ml-14 leading-relaxed">
                            {(ch as any).summary}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </div>

          {/* Comments */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <CommentSection storyId={story.id} />
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">More {story.genre} Stories</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {recommendations.map(r => (
                  <StoryCard key={r.id} story={r} compact />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 mt-6 xl:mt-0">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Reactions</h3>
            <ReactionBar targetType="story" targetId={story.id}
              initialCounts={story.reactionCount ? { like: story.reactionCount } : {}}
              initialUserReaction={story.userReaction} />
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Rating</h3>
            {avgRating > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <StarRating value={avgRating} readonly size="sm" />
                <span className="text-amber-400 font-medium">{avgRating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({ratingCount})</span>
              </div>
            )}
            {isLoggedIn ? (
              <div>
                <p className="text-xs text-gray-500 mb-2">Your rating:</p>
                <StarRating value={userRating} onChange={handleRate} size="md" />
              </div>
            ) : (
              <Link href="/login" className="text-indigo-400 text-sm hover:underline">Sign in to rate</Link>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Authors</h3>
            <div className="space-y-2">
              {story.collaborators?.map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  <Link href={`/profile/${c.id}`} className="flex items-center gap-2 flex-1 hover:opacity-80">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: c.avatarColor }}>
                      {c.username[0].toUpperCase()}
                    </span>
                    <span className="text-gray-300 text-sm">{c.username}</span>
                    <span className="text-gray-600 text-xs">• {c.role}</span>
                  </Link>
                  {isOwner && c.id !== story.authorId && (
                    <button onClick={() => removeCollaborator(c.id)} className="text-red-500 hover:text-red-400 text-xs">✕</button>
                  )}
                </div>
              ))}
            </div>
            {isOwner && (
              <form onSubmit={addCollaborator} className="mt-3 flex gap-2">
                <input value={collabUsername} onChange={e => setCollabUsername(e.target.value)}
                  placeholder="Username"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded text-sm px-2 py-1.5 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-2 py-1.5 rounded transition">
                  Invite
                </button>
              </form>
            )}
            {collabMsg && <p className="text-xs mt-1 text-gray-400">{collabMsg}</p>}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Details</h3>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Genre</dt><dd className="text-gray-300">{story.genre}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd className="text-gray-300 capitalize">{story.status}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Chapters</dt><dd className="text-gray-300">{story.chapters?.length ?? 0}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Published</dt><dd className="text-gray-300">{formatDate(story.createdAt)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Updated</dt><dd className="text-gray-300">{formatDate(story.updatedAt)}</dd></div>
            </dl>
          </div>

          {/* Report */}
          {isLoggedIn && !isOwner && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              {reportSent ? (
                <p className="text-gray-500 text-xs text-center">Report submitted. Thank you.</p>
              ) : showReport ? (
                <form onSubmit={sendReport} className="space-y-2">
                  <p className="text-xs text-gray-400 font-medium">Report this story</p>
                  <textarea value={reportReason} onChange={e => setReportReason(e.target.value)}
                    placeholder="Describe the issue…" rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded text-xs px-3 py-2 text-gray-300 placeholder-gray-600 focus:outline-none resize-none" />
                  <div className="flex gap-2">
                    <button type="submit" className="bg-red-900/50 border border-red-800 text-red-300 text-xs px-3 py-1.5 rounded transition hover:bg-red-900">Submit</button>
                    <button type="button" onClick={() => setShowReport(false)} className="text-gray-500 text-xs hover:text-gray-300">Cancel</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowReport(true)} className="text-gray-600 hover:text-gray-400 text-xs transition">
                  🚩 Report story
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
