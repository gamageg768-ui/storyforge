'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Listing {
  id: number
  authorId: number
  title: string
  description: string
  priceMin: number
  priceMax: number
  genres: string
  turnaround: string
  isOpen: boolean
  updatedAt: string
  author: { id: number; username: string; avatarColor: string }
  _count: { requests: number }
}

interface RequestFormState {
  listingId: number
  authorId: number
  authorName: string
  title: string
  description: string
  budget: string
}

export default function CommissionsPage() {
  const { isLoggedIn } = useAuth()
  const [listings, setListings]       = useState<Listing[]>([])
  const [loading, setLoading]         = useState(true)
  const [reqForm, setReqForm]         = useState<RequestFormState | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [successMsg, setSuccessMsg]   = useState('')

  useEffect(() => {
    fetch('/api/commissions/listings')
      .then(r => r.json())
      .then(data => setListings(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!reqForm || !isLoggedIn) return
    setSubmitting(true)
    const res = await fetch('/api/commissions/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorId:    reqForm.authorId,
        listingId:   reqForm.listingId,
        title:       reqForm.title,
        description: reqForm.description,
        budget:      Number(reqForm.budget ?? 0),
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      setSuccessMsg(`Commission request sent to ${reqForm.authorName}!`)
      setReqForm(null)
      setTimeout(() => setSuccessMsg(''), 5000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-4xl font-playfair font-bold text-white mb-3">Commission Board</h1>
          <p className="text-gray-500">Request a custom story from talented authors. Browse open commissions below.</p>
        </div>

        {successMsg && (
          <div className="bg-emerald-900/40 border border-emerald-700 text-emerald-300 text-sm px-4 py-3 rounded-xl mb-6">
            {successMsg}
          </div>
        )}

        {listings.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <p className="text-4xl mb-4">✍️</p>
            <p className="text-lg">No authors are open for commissions right now</p>
            <p className="text-sm mt-1">Check back soon, or visit an author&apos;s profile to see if they accept requests</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map(l => (
              <div key={l.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: l.author.avatarColor }}
                  >
                    {l.author.username[0].toUpperCase()}
                  </span>
                  <Link href={`/profile/${l.author.id}`} className="text-indigo-400 hover:underline text-sm font-medium">
                    {l.author.username}
                  </Link>
                  <span className="ml-auto bg-emerald-900/40 text-emerald-400 text-xs px-2 py-0.5 rounded-full">Open</span>
                </div>

                <h3 className="text-white font-semibold mb-2">{l.title}</h3>
                <p className="text-gray-400 text-sm flex-1 mb-4 line-clamp-3">{l.description}</p>

                <div className="flex flex-wrap gap-2 text-xs mb-4">
                  {l.priceMin > 0 && (
                    <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
                      ${l.priceMin}{l.priceMax > l.priceMin ? `–$${l.priceMax}` : ''}
                    </span>
                  )}
                  {l.turnaround && (
                    <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">⏱ {l.turnaround}</span>
                  )}
                  {l.genres && l.genres.split(',').map(g => g.trim()).filter(Boolean).map(g => (
                    <span key={g} className="bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded-full">{g}</span>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (!isLoggedIn) { window.location.href = '/login'; return }
                    setReqForm({ listingId: l.id, authorId: l.author.id, authorName: l.author.username, title: '', description: '', budget: '' })
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2 rounded-lg transition"
                >
                  Request Commission
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      {reqForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setReqForm(null) }}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-1">Commission Request</h2>
            <p className="text-sm text-gray-500 mb-5">Sending to <span className="text-indigo-400">{reqForm.authorName}</span></p>
            <form onSubmit={submitRequest} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Story title / concept *</label>
                <input
                  value={reqForm.title}
                  onChange={e => setReqForm(f => f && { ...f, title: e.target.value })}
                  required
                  placeholder="e.g. Enemies-to-lovers fantasy romance"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description *</label>
                <textarea
                  value={reqForm.description}
                  onChange={e => setReqForm(f => f && { ...f, description: e.target.value })}
                  required
                  rows={4}
                  placeholder="Describe what you want — genre, characters, tone, length, any key plot points…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Your budget ($, optional)</label>
                <input
                  type="number"
                  value={reqForm.budget}
                  onChange={e => setReqForm(f => f && { ...f, budget: e.target.value })}
                  min="0"
                  placeholder="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition"
                >
                  {submitting ? 'Sending…' : 'Send Request'}
                </button>
                <button type="button" onClick={() => setReqForm(null)} className="px-4 text-gray-500 hover:text-gray-300 text-sm transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
