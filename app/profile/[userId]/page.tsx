'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import StoryCard from '@/components/StoryCard'
import { User } from '@/types'

function formatJoined(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

interface SupporterTier {
  id: number
  authorId: number
  name: string
  description: string
  priceMonthly: number
  earlyAccessDays: number
  stripePriceId: string
  isActive: boolean
  _count?: { subscriptions: number }
}

interface CommissionListing {
  id: number
  title: string
  description: string
  priceMin: number
  priceMax: number
  genres: string
  turnaround: string
  isOpen: boolean
}

interface CommissionRequest {
  id: number
  userId: number
  title: string
  description: string
  budget: number
  status: string
  authorNote: string
  createdAt: string
  user: { id: number; username: string; avatarColor: string }
}

const TIP_PRESETS = [
  { label: '$3', cents: 300 },
  { label: '$5', cents: 500 },
  { label: '$10', cents: 1000 },
  { label: '$20', cents: 2000 },
]

export default function ProfilePage({ params }: { params: { userId: string } }) {
  const { user: currentUser, isLoggedIn } = useAuth()
  const [profile,    setProfile]    = useState<User | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [tab, setTab] = useState<'stories' | 'collabs' | 'achievements' | 'commissions'>('stories')
  const [achievements, setAchievements] = useState<any[]>([])
  const [achLoaded,    setAchLoaded]    = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [bioInput,   setBioInput]   = useState('')
  const [following,  setFollowing]  = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  // Toast
  const [toast, setToast] = useState('')

  // Tip state
  const [tipModal,   setTipModal]   = useState(false)
  const [tipCents,   setTipCents]   = useState(500)
  const [tipCustom,  setTipCustom]  = useState('')
  const [tipMessage, setTipMessage] = useState('')
  const [tipSending, setTipSending] = useState(false)

  // Supporter tier
  const [supporterTier, setSupporterTier] = useState<SupporterTier | null>(null)
  const [isSubscriber,  setIsSubscriber]  = useState(false)
  const [tierLoaded,    setTierLoaded]    = useState(false)
  const [tierEditing,   setTierEditing]   = useState(false)
  const [tierForm, setTierForm] = useState({ name: '', description: '', priceMonthly: '', earlyAccessDays: '7' })
  const [tierSaving,    setTierSaving]    = useState(false)

  // Commissions
  const [commissionListing,  setCommissionListing]  = useState<CommissionListing | null>(null)
  const [commissionRequests, setCommissionRequests] = useState<CommissionRequest[]>([])
  const [commReqLoaded,      setCommReqLoaded]      = useState(false)
  const [commEditing,        setCommEditing]        = useState(false)
  const [commForm, setCommForm] = useState({ title: '', description: '', priceMin: '', priceMax: '', genres: '', turnaround: '' })
  const [commSaving,         setCommSaving]         = useState(false)
  const [updatingReq,        setUpdatingReq]        = useState<number | null>(null)

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

  // Handle Stripe redirect success params
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    let msg = ''
    if (sp.get('tip') === 'success')   msg = 'Tip sent — thank you for your support!'
    if (sp.get('subscribed') === '1')  msg = 'You are now a supporter! Early access chapters are unlocked.'
    if (msg) {
      setToast(msg)
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(() => setToast(''), 6000)
    }
  }, [])

  // Load supporter tier, subscription status, and commission listing
  useEffect(() => {
    const uid = params.userId

    fetch(`/api/supporters/tiers?authorId=${uid}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: SupporterTier[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const t = data[0]
          setSupporterTier(t)
          setTierForm({
            name: t.name,
            description: t.description,
            priceMonthly: String(t.priceMonthly / 100),
            earlyAccessDays: String(t.earlyAccessDays),
          })
        }
        setTierLoaded(true)
      })
      .catch(() => setTierLoaded(true))

    if (isLoggedIn && currentUser?.id !== uid) {
      fetch(`/api/supporters/check?authorId=${uid}`)
        .then(r => r.json())
        .then(d => setIsSubscriber(!!d.isSubscriber))
        .catch(() => {})
    }

    fetch(`/api/commissions/listings?authorId=${uid}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: CommissionListing[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const l = data[0]
          setCommissionListing(l)
          setCommForm({
            title: l.title,
            description: l.description,
            priceMin: l.priceMin > 0 ? String(l.priceMin) : '',
            priceMax: l.priceMax > 0 ? String(l.priceMax) : '',
            genres: l.genres,
            turnaround: l.turnaround,
          })
        }
      })
      .catch(() => {})
  }, [params.userId, isLoggedIn, currentUser?.id])

  async function handleFollow() {
    if (!isLoggedIn) return
    setFollowLoading(true)
    const prev = following
    setFollowing(!prev)
    setProfile(p => p ? { ...p, followersCount: (p.followersCount ?? 0) + (prev ? -1 : 1) } : p)
    const res = await fetch('/api/social/follow', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: Number(params.userId) }),
    })
    if (!res.ok) {
      setFollowing(prev)
      setProfile(p => p ? { ...p, followersCount: (p.followersCount ?? 0) + (prev ? 1 : -1) } : p)
    }
    setFollowLoading(false)
  }

  async function saveBio() {
    const res = await fetch('/api/users/me', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: bioInput }),
    })
    if (res.ok) { setProfile(p => p ? { ...p, bio: bioInput } : p); setEditingBio(false) }
  }

  async function sendTip() {
    if (!isLoggedIn || !profile) return
    setTipSending(true)
    const amount = tipCustom ? Math.round(Number(tipCustom) * 100) : tipCents
    const res = await fetch('/api/tips/create-checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toAuthorId: profile.id, amount, message: tipMessage }),
    })
    const data = await res.json()
    setTipSending(false)
    if (data.url) window.location.href = data.url
  }

  async function subscribeTier() {
    if (!isLoggedIn || !supporterTier) return
    const res = await fetch('/api/supporters/subscribe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId: supporterTier.id }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  async function saveTier() {
    setTierSaving(true)
    const body = {
      name: tierForm.name,
      description: tierForm.description,
      priceMonthly: Math.round(Number(tierForm.priceMonthly) * 100),
      earlyAccessDays: Number(tierForm.earlyAccessDays),
    }
    const res = await fetch('/api/supporters/tiers', {
      method: supporterTier ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const data = await res.json()
      setSupporterTier(data)
      setTierEditing(false)
      showToast('Supporter tier saved!')
    }
    setTierSaving(false)
  }

  async function saveCommListing() {
    setCommSaving(true)
    const body = {
      title: commForm.title,
      description: commForm.description,
      priceMin: commForm.priceMin ? Number(commForm.priceMin) : 0,
      priceMax: commForm.priceMax ? Number(commForm.priceMax) : 0,
      genres: commForm.genres,
      turnaround: commForm.turnaround,
    }
    const res = await fetch('/api/commissions/listings', {
      method: commissionListing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const data = await res.json()
      setCommissionListing(data)
      setCommEditing(false)
      showToast('Commission listing saved!')
    }
    setCommSaving(false)
  }

  async function toggleCommOpen(isOpen: boolean) {
    const res = await fetch('/api/commissions/listings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOpen }),
    })
    if (res.ok) setCommissionListing(l => l ? { ...l, isOpen } : l)
  }

  async function updateRequestStatus(id: number, status: string) {
    setUpdatingReq(id)
    const res = await fetch(`/api/commissions/requests/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setCommissionRequests(rs => rs.map(r => r.id === id ? { ...r, ...updated } : r))
    }
    setUpdatingReq(null)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
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

  const tipFinalCents = tipCustom ? Math.round(Number(tipCustom) * 100) : tipCents

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-900/90 border border-emerald-700 text-emerald-300 text-sm px-5 py-3 rounded-xl shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}

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
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-playfair text-2xl font-bold text-white">{profile.username}</h1>
                {isSubscriber && (
                  <span className="bg-amber-900/40 border border-amber-700/50 text-amber-400 text-xs px-2 py-0.5 rounded-full">⭐ Supporter</span>
                )}
              </div>

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

              {/* Action buttons */}
              {!isOwner && isLoggedIn && (
                <div className="flex flex-wrap gap-2">
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
                  <button
                    onClick={() => setTipModal(true)}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium bg-amber-600/20 border border-amber-700/40 text-amber-400 hover:bg-amber-600/30 transition"
                  >
                    ☕ Send a Tip
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Supporter Tier card */}
        {tierLoaded && (supporterTier || isOwner) && (
          <div className="bg-gray-900 border border-amber-900/30 rounded-2xl p-5 mb-6">
            {supporterTier && !tierEditing ? (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-400">⭐</span>
                    <h3 className="text-white font-semibold">{supporterTier.name}</h3>
                    <span className="bg-amber-900/30 text-amber-400 text-xs px-2 py-0.5 rounded-full">
                      ${(supporterTier.priceMonthly / 100).toFixed(2)}/mo
                    </span>
                  </div>
                  {supporterTier.description && (
                    <p className="text-gray-400 text-sm mb-2">{supporterTier.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    📖 Read new chapters {supporterTier.earlyAccessDays} day{supporterTier.earlyAccessDays !== 1 ? 's' : ''} early
                    {supporterTier._count != null && ` · ${supporterTier._count.subscriptions} supporter${supporterTier._count.subscriptions !== 1 ? 's' : ''}`}
                  </p>
                </div>
                {!isOwner && isLoggedIn && (
                  <button
                    onClick={subscribeTier}
                    disabled={isSubscriber}
                    className={`shrink-0 px-5 py-2 rounded-lg text-sm font-medium transition ${
                      isSubscriber
                        ? 'bg-gray-700 text-gray-400 cursor-default'
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    {isSubscriber ? '✓ Supporting' : `Support ${profile.username}`}
                  </button>
                )}
                {isOwner && (
                  <button
                    onClick={() => setTierEditing(true)}
                    className="shrink-0 text-xs text-gray-400 hover:text-gray-200 border border-gray-700 px-3 py-1.5 rounded-lg transition"
                  >
                    Edit Tier
                  </button>
                )}
              </div>
            ) : isOwner ? (
              <div>
                <h3 className="text-white font-semibold mb-4">{supporterTier ? 'Edit Supporter Tier' : 'Create Supporter Tier'}</h3>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Tier name *</label>
                    <input
                      value={tierForm.name}
                      onChange={e => setTierForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Early Reader"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Monthly price ($) *</label>
                    <input
                      type="number" min="1" step="0.01"
                      value={tierForm.priceMonthly}
                      onChange={e => setTierForm(f => ({ ...f, priceMonthly: e.target.value }))}
                      placeholder="5.00"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-400 mb-1 block">Description</label>
                    <input
                      value={tierForm.description}
                      onChange={e => setTierForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="What do supporters get?"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Early access days before public release</label>
                    <input
                      type="number" min="1" max="90"
                      value={tierForm.earlyAccessDays}
                      onChange={e => setTierForm(f => ({ ...f, earlyAccessDays: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={saveTier}
                    disabled={tierSaving || !tierForm.name || !tierForm.priceMonthly}
                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                  >
                    {tierSaving ? 'Saving…' : 'Save Tier'}
                  </button>
                  {supporterTier && (
                    <button onClick={() => setTierEditing(false)} className="text-gray-400 text-sm hover:text-gray-200 px-3 py-2">Cancel</button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-800 mb-6 overflow-x-auto">
          {(['stories', 'collabs', 'achievements', 'commissions'] as const).map(t => (
            <button
              key={t}
              onClick={() => {
                setTab(t)
                if (t === 'achievements' && !achLoaded) {
                  fetch(`/api/users/${params.userId}/achievements`)
                    .then(r => r.json())
                    .then(data => { setAchievements(data); setAchLoaded(true) })
                }
                if (t === 'commissions' && isOwner && !commReqLoaded) {
                  fetch('/api/commissions/requests')
                    .then(r => r.json())
                    .then(data => { setCommissionRequests(Array.isArray(data) ? data : []); setCommReqLoaded(true) })
                }
              }}
              className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap capitalize ${
                tab === t ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {t === 'stories'      && `Stories (${profile.stories?.length ?? 0})`}
              {t === 'collabs'      && `Co-Authored (${profile.collaborations?.length ?? 0})`}
              {t === 'achievements' && `Achievements${achievements.length > 0 ? ` (${achievements.length})` : ''}`}
              {t === 'commissions'  && (
                <span className="flex items-center gap-1">
                  Commissions
                  {commissionListing?.isOpen && <span className="text-emerald-400 text-xs">●</span>}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Stories */}
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

        {/* Commissions */}
        {tab === 'commissions' && (
          isOwner ? (
            <div>
              {/* Owner — listing card or create/edit form */}
              {commissionListing && !commEditing ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold">{commissionListing.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          commissionListing.isOpen ? 'bg-emerald-900/40 text-emerald-400' : 'bg-gray-800 text-gray-500'
                        }`}>
                          {commissionListing.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{commissionListing.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {commissionListing.priceMin > 0 && (
                          <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
                            ${commissionListing.priceMin}{commissionListing.priceMax > commissionListing.priceMin ? `–$${commissionListing.priceMax}` : ''}
                          </span>
                        )}
                        {commissionListing.turnaround && (
                          <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">⏱ {commissionListing.turnaround}</span>
                        )}
                        {commissionListing.genres && commissionListing.genres.split(',').map(g => g.trim()).filter(Boolean).map(g => (
                          <span key={g} className="bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded-full">{g}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setCommEditing(true)}
                        className="text-xs border border-gray-700 text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg transition">
                        Edit
                      </button>
                      <button
                        onClick={() => toggleCommOpen(!commissionListing.isOpen)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition ${
                          commissionListing.isOpen
                            ? 'bg-gray-800 text-gray-400 hover:text-white'
                            : 'bg-emerald-800/60 text-emerald-300 hover:bg-emerald-700/60'
                        }`}
                      >
                        {commissionListing.isOpen ? 'Close' : 'Reopen'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
                  <h3 className="text-white font-semibold mb-4">
                    {commissionListing ? 'Edit Commission Listing' : 'Create Commission Listing'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Title *</label>
                      <input value={commForm.title} onChange={e => setCommForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Fantasy & Romance Commissions"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Description *</label>
                      <textarea value={commForm.description} onChange={e => setCommForm(f => ({ ...f, description: e.target.value }))}
                        rows={3} placeholder="What do you write? What do you need from the client?"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Min price ($)</label>
                        <input type="number" min="0" value={commForm.priceMin}
                          onChange={e => setCommForm(f => ({ ...f, priceMin: e.target.value }))}
                          placeholder="0"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Max price ($)</label>
                        <input type="number" min="0" value={commForm.priceMax}
                          onChange={e => setCommForm(f => ({ ...f, priceMax: e.target.value }))}
                          placeholder="0"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Genres (comma-separated)</label>
                        <input value={commForm.genres} onChange={e => setCommForm(f => ({ ...f, genres: e.target.value }))}
                          placeholder="Fantasy, Romance"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Turnaround</label>
                        <input value={commForm.turnaround} onChange={e => setCommForm(f => ({ ...f, turnaround: e.target.value }))}
                          placeholder="e.g. 1–2 weeks"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={saveCommListing}
                        disabled={commSaving || !commForm.title || !commForm.description}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                        {commSaving ? 'Saving…' : 'Save Listing'}
                      </button>
                      {commissionListing && (
                        <button onClick={() => setCommEditing(false)} className="text-gray-400 text-sm hover:text-gray-200 px-3 py-2">Cancel</button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Incoming requests */}
              <h3 className="text-white font-semibold mb-4">
                Incoming Requests {commReqLoaded && `(${commissionRequests.length})`}
              </h3>
              {!commReqLoaded ? (
                <div className="text-gray-600 text-sm">Loading requests…</div>
              ) : commissionRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <p className="text-2xl mb-2">📬</p>
                  <p>No commission requests yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commissionRequests.map(req => (
                    <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: req.user.avatarColor }}
                        >
                          {req.user.username[0].toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-indigo-400 text-sm font-medium">{req.user.username}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              req.status === 'pending'   ? 'bg-yellow-900/40 text-yellow-400' :
                              req.status === 'accepted'  ? 'bg-emerald-900/40 text-emerald-400' :
                              req.status === 'declined'  ? 'bg-red-900/40 text-red-400' :
                              'bg-indigo-900/40 text-indigo-400'
                            }`}>
                              {req.status}
                            </span>
                            {req.budget > 0 && <span className="text-gray-500 text-xs">${req.budget} budget</span>}
                          </div>
                          <p className="text-white text-sm font-medium mb-1">{req.title}</p>
                          <p className="text-gray-400 text-sm mb-3">{req.description}</p>
                          {req.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateRequestStatus(req.id, 'accepted')}
                                disabled={updatingReq === req.id}
                                className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => updateRequestStatus(req.id, 'declined')}
                                disabled={updatingReq === req.id}
                                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-xs px-3 py-1.5 rounded-lg transition"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                          {req.status === 'accepted' && (
                            <button
                              onClick={() => updateRequestStatus(req.id, 'delivered')}
                              disabled={updatingReq === req.id}
                              className="bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition"
                            >
                              Mark Delivered
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Visitor view
            commissionListing?.isOpen ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-xl">
                <span className="bg-emerald-900/40 text-emerald-400 text-xs px-2 py-0.5 rounded-full mb-3 inline-block">
                  Open for Commissions
                </span>
                <h3 className="text-white font-semibold mb-2">{commissionListing.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{commissionListing.description}</p>
                <div className="flex flex-wrap gap-2 text-xs mb-5">
                  {commissionListing.priceMin > 0 && (
                    <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
                      ${commissionListing.priceMin}{commissionListing.priceMax > commissionListing.priceMin ? `–$${commissionListing.priceMax}` : ''}
                    </span>
                  )}
                  {commissionListing.turnaround && (
                    <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">⏱ {commissionListing.turnaround}</span>
                  )}
                  {commissionListing.genres && commissionListing.genres.split(',').map(g => g.trim()).filter(Boolean).map(g => (
                    <span key={g} className="bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded-full">{g}</span>
                  ))}
                </div>
                <Link
                  href="/commissions"
                  className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
                >
                  Request a Commission
                </Link>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-600">
                <p className="text-2xl mb-3">✍️</p>
                <p>{profile.username} is not currently open for commissions.</p>
              </div>
            )
          )
        )}
      </div>

      {/* Tip Modal */}
      {tipModal && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setTipModal(false) }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-1">Send a Tip</h2>
            <p className="text-sm text-gray-500 mb-5">
              Support <span className="text-amber-400">{profile.username}</span> — 100% goes to them
            </p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {TIP_PRESETS.map(p => (
                <button
                  key={p.cents}
                  onClick={() => { setTipCents(p.cents); setTipCustom('') }}
                  className={`py-2 rounded-lg text-sm font-medium transition ${
                    tipCents === p.cents && !tipCustom
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Custom amount ($)</label>
              <input
                type="number" min="0.50" step="0.01"
                value={tipCustom}
                onChange={e => setTipCustom(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="mb-5">
              <label className="text-xs text-gray-400 mb-1 block">Message (optional)</label>
              <input
                value={tipMessage}
                onChange={e => setTipMessage(e.target.value)}
                placeholder="Say something nice…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={sendTip}
                disabled={tipSending || tipFinalCents < 50}
                className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                {tipSending ? 'Redirecting…' : `Send $${(tipFinalCents / 100).toFixed(2)}`}
              </button>
              <button onClick={() => setTipModal(false)} className="px-4 text-gray-500 hover:text-gray-300 text-sm transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
