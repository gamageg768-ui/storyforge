'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface Challenge {
  id: number
  title: string
  description: string
  goal: number
  goalType: string
  startDate: string
  endDate: string
  _count: { entries: number }
  userEntry: { id: number; progress: number; joinedAt: string } | null
}

function daysLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
      <div
        className="h-1.5 rounded-full bg-indigo-500 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function ChallengesPage() {
  const { isLoggedIn } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading]       = useState(true)
  const [joining, setJoining]       = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/challenges')
      .then(r => r.json())
      .then(data => setChallenges(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  async function join(id: number) {
    if (!isLoggedIn) { window.location.href = '/login'; return }
    setJoining(id)
    const res = await fetch(`/api/challenges/${id}/join`, { method: 'POST' })
    if (res.ok) {
      const entry = await res.json()
      setChallenges(prev => prev.map(c =>
        c.id === id ? { ...c, userEntry: entry, _count: { entries: c._count.entries + 1 } } : c
      ))
    }
    setJoining(null)
  }

  const myChallenges = challenges.filter(c => c.userEntry)
  const available    = challenges.filter(c => !c.userEntry)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-playfair font-bold text-white mb-3">Reading Challenges</h1>
          <p className="text-gray-500">Push your reading goals and earn bragging rights</p>
        </div>

        {/* My active challenges */}
        {myChallenges.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-white mb-4">My Challenges</h2>
            <div className="space-y-3">
              {myChallenges.map(c => {
                const pct = Math.min(100, Math.round(((c.userEntry?.progress ?? 0) / c.goal) * 100))
                const done = pct >= 100
                return (
                  <div key={c.id} className={`bg-gray-900 border rounded-xl p-5 ${done ? 'border-emerald-700/60' : 'border-gray-800'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {done && <span className="text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-0.5 rounded-full">Completed!</span>}
                          <h3 className="text-white font-medium">{c.title}</h3>
                        </div>
                        <p className="text-gray-500 text-xs mb-3">{c.description}</p>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">
                            {c.userEntry?.progress ?? 0} / {c.goal} {c.goalType}
                          </span>
                          <span className="text-gray-600">{pct}%</span>
                        </div>
                        <ProgressBar value={c.userEntry?.progress ?? 0} max={c.goal} />
                      </div>
                      <div className="text-right text-xs text-gray-600 shrink-0">
                        <p>{daysLeft(c.endDate)}d left</p>
                        <p className="mt-1">{c._count.entries} readers</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Available challenges */}
        {available.length > 0 ? (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Available Challenges</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {available.map(c => (
                <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{c.goalType === 'chapters' ? '📖' : '📚'}</span>
                      <h3 className="text-white font-semibold">{c.title}</h3>
                    </div>
                    <p className="text-gray-500 text-sm mb-3">{c.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs mb-4">
                      <span className="bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded-full">
                        {c.goal} {c.goalType}
                      </span>
                      <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                        Ends {formatDate(c.endDate)}
                      </span>
                      <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                        {daysLeft(c.endDate)}d left
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-4">{c._count.entries} {c._count.entries === 1 ? 'reader' : 'readers'} joined</p>
                  </div>
                  <button
                    onClick={() => join(c.id)}
                    disabled={joining === c.id}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition"
                  >
                    {joining === c.id ? 'Joining…' : 'Join Challenge'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : myChallenges.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <p className="text-4xl mb-4">🏆</p>
            <p className="text-lg">No active challenges right now</p>
            <p className="text-sm mt-1">Check back soon — admins add new challenges regularly</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
