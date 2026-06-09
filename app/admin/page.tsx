'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

type Tab = 'reports' | 'users' | 'featured'

interface Report {
  id:         number
  targetType: string
  targetId:   number
  reason:     string
  status:     string
  createdAt:  string
  reporter:   { id: number; username: string; avatarColor: string }
}

interface AdminUser {
  id:          number
  username:    string
  email:       string
  avatarColor: string
  isAdmin:     boolean
  isBanned:    boolean
  createdAt:   string
  _count:      { stories: number; followers: number }
}

interface FeaturedEntry {
  id:          number
  storyId:     number
  category:    string
  displayOrder:number
  expiresAt:   string | null
  story:       { title: string; coverColor: string }
}

const CATEGORIES = ['staff_pick', 'hidden_gem', 'new_author']

export default function AdminPage() {
  const { isLoggedIn } = useAuth()
  const [tab,       setTab]     = useState<Tab>('reports')
  const [reports,   setReports] = useState<Report[]>([])
  const [users,     setUsers]   = useState<AdminUser[]>([])
  const [search,    setSearch]  = useState('')
  const [loading,   setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  // Featured state
  const [featured,      setFeatured]     = useState<FeaturedEntry[]>([])
  const [addStoryId,    setAddStoryId]   = useState('')
  const [addCategory,   setAddCategory]  = useState('staff_pick')
  const [addOrder,      setAddOrder]     = useState('0')
  const [addExpiry,     setAddExpiry]    = useState('')
  const [addMsg,        setAddMsg]       = useState('')

  useEffect(() => {
    if (!isLoggedIn) return
    loadTab(tab)
  }, [isLoggedIn, tab])

  async function loadTab(t: Tab) {
    setLoading(true)
    if (t === 'reports') {
      const res = await fetch('/api/admin/reports?status=pending')
      if (res.status === 403) { setForbidden(true); return }
      setReports(await res.json())
    } else if (t === 'users') {
      const res = await fetch('/api/admin/users')
      if (res.status === 403) { setForbidden(true); return }
      setUsers(await res.json())
    } else {
      const res = await fetch('/api/admin/featured')
      if (res.status === 403) { setForbidden(true); return }
      setFeatured(await res.json())
    }
    setLoading(false)
    setForbidden(false)
  }

  async function resolveReport(id: number, status: 'resolved' | 'dismissed') {
    await fetch('/api/admin/reports', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setReports(prev => prev.filter(r => r.id !== id))
  }

  async function toggleBan(userId: number, isBanned: boolean) {
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isBanned: !isBanned }),
    })
    if (res.ok) {
      const updated = await res.json()
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: updated.isBanned } : u))
    }
  }

  async function addFeatured(e: React.FormEvent) {
    e.preventDefault()
    setAddMsg('')
    if (!addStoryId.trim()) { setAddMsg('Story ID required'); return }
    const res = await fetch('/api/admin/featured', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyId:      Number(addStoryId),
        category:     addCategory,
        displayOrder: Number(addOrder),
        expiresAt:    addExpiry || null,
      }),
    })
    if (res.ok) {
      setAddMsg('Added!')
      setAddStoryId('')
      loadTab('featured')
    } else {
      const data = await res.json()
      setAddMsg(data.error || 'Failed')
    }
  }

  async function removeFeatured(id: number) {
    if (!confirm('Remove this featured entry?')) return
    await fetch('/api/admin/featured', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    })
    setFeatured(prev => prev.filter(f => f.id !== id))
  }

  if (!isLoggedIn) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Access denied.</p>
    </main>
  )

  if (forbidden) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-3">🚫</p>
        <p className="text-white font-medium">Admin access required</p>
        <p className="text-gray-400 text-sm mt-1">Your account does not have admin privileges.</p>
      </div>
    </main>
  )

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="font-playfair text-3xl font-bold text-white mb-2">Admin Panel</h1>
        <p className="text-gray-400 mb-6">Moderate content and manage users.</p>

        <div className="flex gap-2 mb-6">
          {(['reports', 'users', 'featured'] as Tab[]).map(t => (
            <button key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >{t}</button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : tab === 'reports' ? (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-3xl mb-2">✅</p>
                <p>No pending reports.</p>
              </div>
            ) : reports.map(r => (
              <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded capitalize">
                        {r.targetType} #{r.targetId}
                      </span>
                      <span className="text-gray-500 text-xs">
                        by {r.reporter.username} • {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{r.reason}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => resolveReport(r.id, 'resolved')}
                      className="bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-300 text-xs px-3 py-1.5 rounded-lg transition"
                    >Take action</button>
                    <button
                      onClick={() => resolveReport(r.id, 'dismissed')}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs px-3 py-1.5 rounded-lg transition"
                    >Dismiss</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'users' ? (
          <div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 mb-4"
            />
            <div className="space-y-2">
              {filteredUsers.map(u => (
                <div key={u.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: u.avatarColor }}
                  >
                    {u.username[0].toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{u.username}</span>
                      {u.isAdmin  && <span className="text-xs bg-indigo-900/50 text-indigo-300 px-1.5 py-0.5 rounded">admin</span>}
                      {u.isBanned && <span className="text-xs bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded">banned</span>}
                    </div>
                    <p className="text-gray-500 text-xs">{u.email} • {u._count.stories} stories • {u._count.followers} followers</p>
                  </div>
                  {!u.isAdmin && (
                    <button
                      onClick={() => toggleBan(u.id, u.isBanned)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition shrink-0 ${
                        u.isBanned
                          ? 'bg-emerald-900/30 border-emerald-800 text-emerald-300 hover:bg-emerald-900/50'
                          : 'bg-red-900/30 border-red-800 text-red-300 hover:bg-red-900/50'
                      }`}
                    >
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Featured tab */
          <div className="space-y-6">
            {/* Add form */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Add Featured Story</h3>
              <form onSubmit={addFeatured} className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Story ID</label>
                  <input
                    value={addStoryId}
                    onChange={e => setAddStoryId(e.target.value)}
                    placeholder="e.g. 42"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select
                    value={addCategory}
                    onChange={e => setAddCategory(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Display Order</label>
                  <input
                    type="number" min="0"
                    value={addOrder}
                    onChange={e => setAddOrder(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Expires (optional)</label>
                  <input
                    type="datetime-local"
                    value={addExpiry}
                    onChange={e => setAddExpiry(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition"
                  >
                    Add to Featured
                  </button>
                  {addMsg && <span className="text-sm text-gray-400">{addMsg}</span>}
                </div>
              </form>
            </div>

            {/* Current featured list */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Current Featured ({featured.length})</h3>
              {featured.length === 0 ? (
                <p className="text-gray-500 text-sm">No featured stories yet.</p>
              ) : (
                <div className="space-y-2">
                  {featured.map(f => (
                    <div key={f.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div
                        className="w-8 h-10 rounded shrink-0"
                        style={{ background: `linear-gradient(135deg, ${f.story.coverColor}cc, ${f.story.coverColor}55)` }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{f.story.title}</p>
                        <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                          <span className="capitalize">{f.category.replace('_', ' ')}</span>
                          <span>Order: {f.displayOrder}</span>
                          {f.expiresAt && <span>Expires: {new Date(f.expiresAt).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFeatured(f.id)}
                        className="text-xs text-gray-500 hover:text-red-400 transition shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
