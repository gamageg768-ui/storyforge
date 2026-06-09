'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import StoryCard from '@/components/StoryCard'
import { User } from '@/types'

function formatJoined(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function ProfilePage({ params }: { params: { userId: string } }) {
  const { user: currentUser, isLoggedIn } = useAuth()
  const [profile,    setProfile]    = useState<User | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [tab,          setTab]          = useState<'stories' | 'collabs' | 'achievements'>('stories')
  const [achievements, setAchievements] = useState<any[]>([])
  const [achLoaded,    setAchLoaded]    = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [bioInput,   setBioInput]   = useState('')
  const [following,  setFollowing]  = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const isOwner = isLoggedIn && currentUser?.id === params.userId

  useEffect(() => {
    fetch(`/api/users/${params.userId}`)
      .then(r => r.json())
      .then(data => {
        setProfile(data)
        setFollowing(data.isFollowing)
        setBioInput(data.bio)
        setLoading(false)
      })
  }, [params.userId])

  async function handleFollow() {
    if (!isLoggedIn) return
    setFollowLoading(true)
    const prev = following
    setFollowing(!prev)
    setProfile(p => p ? {
      ...p,
      followersCount: (p.followersCount ?? 0) + (prev ? -1 : 1),
    } : p)

    const res = await fetch('/api/social/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: Number(params.userId) }),
    })
    if (!res.ok) {
      setFollowing(prev)
      setProfile(p => p ? {
        ...p,
        followersCount: (p.followersCount ?? 0) + (prev ? 1 : -1),
      } : p)
    }
    setFollowLoading(false)
  }

  async function saveBio() {
    const res = await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: bioInput }),
    })
    if (res.ok) {
      setProfile(p => p ? { ...p, bio: bioInput } : p)
      setEditingBio(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500">Loading profile…</div>
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500">User not found.</div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-5">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shrink-0"
              style={{ backgroundColor: profile.avatarColor }}
            >
              {profile.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-playfair text-2xl font-bold text-white mb-1">{profile.username}</h1>

              {/* Bio */}
              {editingBio ? (
                <div className="mb-3">
                  <textarea
                    value={bioInput}
                    onChange={e => setBioInput(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-indigo-500 resize-none max-w-lg"
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={saveBio} className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg">Save</button>
                    <button onClick={() => setEditingBio(false)} className="text-gray-400 text-xs px-3 py-1.5">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm mb-3 max-w-xl">
                  {profile.bio || (isOwner ? <span className="italic text-gray-600">No bio yet. Click Edit to add one.</span> : '')}
                  {isOwner && !editingBio && (
                    <button onClick={() => setEditingBio(true)} className="ml-2 text-xs text-indigo-400 hover:underline">Edit</button>
                  )}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                <span><strong className="text-white">{profile.stories?.length ?? 0}</strong> stories</span>
                <span><strong className="text-white">{profile.followersCount ?? 0}</strong> followers</span>
                <span><strong className="text-white">{profile.followingCount ?? 0}</strong> following</span>
                <span>Joined {formatJoined(profile.createdAt)}</span>
              </div>

              {/* Follow button */}
              {!isOwner && isLoggedIn && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                    following
                      ? 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-800 mb-6">
          <button
            onClick={() => setTab('stories')}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              tab === 'stories' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Stories ({profile.stories?.length ?? 0})
          </button>
          <button
            onClick={() => setTab('collabs')}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              tab === 'collabs' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Co-Authored ({profile.collaborations?.length ?? 0})
          </button>
          <button
            onClick={() => {
              setTab('achievements')
              if (!achLoaded) {
                fetch(`/api/users/${params.userId}/achievements`)
                  .then(r => r.json())
                  .then(data => { setAchievements(data); setAchLoaded(true) })
              }
            }}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              tab === 'achievements' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Achievements {achievements.length > 0 && `(${achievements.length})`}
          </button>
        </div>

        {/* Stories grid */}
        {tab === 'stories' && (
          profile.stories && profile.stories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {profile.stories.map(s => <StoryCard key={s.id} story={s} />)}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <p className="text-3xl mb-3">✍️</p>
              <p>{isOwner ? "You haven't written any stories yet." : 'No stories published yet.'}</p>
              {isOwner && (
                <Link href="/write" className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Start Writing</Link>
              )}
            </div>
          )
        )}

        {/* Achievements */}
        {tab === 'achievements' && (
          achLoaded ? (
            achievements.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {achievements.map((a: any) => (
                  <div key={a.achievement} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                    <div className="text-4xl mb-2">{a.icon}</div>
                    <p className="text-white text-sm font-semibold">{a.name}</p>
                    <p className="text-gray-500 text-xs mt-1">{a.desc}</p>
                    <p className="text-gray-700 text-xs mt-2">{new Date(a.earnedAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <p className="text-3xl mb-3">🏆</p>
                <p>{isOwner ? 'Publish stories to earn your first achievement!' : 'No achievements yet.'}</p>
              </div>
            )
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center animate-pulse">
                  <div className="w-10 h-10 bg-gray-700 rounded-full mx-auto mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-3/4 mx-auto mb-1" />
                  <div className="h-2 bg-gray-700 rounded w-full" />
                </div>
              ))}
            </div>
          )
        )}

        {/* Collaborations */}
        {tab === 'collabs' && (
          profile.collaborations && profile.collaborations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {profile.collaborations.map(c => (
                <Link key={c.id} href={`/stories/${c.id}`}
                  className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl overflow-hidden transition group">
                  <div className="h-20 flex items-end p-3"
                    style={{ background: `linear-gradient(135deg, ${c.coverColor}cc, ${c.coverColor}44)` }}>
                    <span className="bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">{c.genre}</span>
                  </div>
                  <div className="p-3">
                    <p className="font-playfair text-white font-semibold text-sm group-hover:text-indigo-300 transition line-clamp-2 mb-1">{c.title}</p>
                    <p className="text-gray-500 text-xs">by {c.authorName}</p>
                    <span className="inline-block mt-2 bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">{c.role}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <p className="text-3xl mb-3">👥</p>
              <p>No collaborations yet.</p>
            </div>
          )
        )}
      </div>
    </main>
  )
}
