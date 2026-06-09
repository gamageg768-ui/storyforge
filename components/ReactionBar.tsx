'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { REACTIONS, ReactionCounts } from '@/types'

interface Props {
  targetType: 'story' | 'chapter'
  targetId: number
  initialCounts: ReactionCounts
  initialUserReaction?: string | null
  onUpdate?: (counts: ReactionCounts, userReaction: string | null) => void
}

export default function ReactionBar({
  targetType,
  targetId,
  initialCounts,
  initialUserReaction,
  onUpdate,
}: Props) {
  const { isLoggedIn } = useAuth()
  const router = useRouter()
  const [counts, setCounts] = useState<ReactionCounts>(initialCounts)
  const [userReaction, setUserReaction] = useState<string | null>(initialUserReaction ?? null)
  const [expanded, setExpanded] = useState(false)

  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0)

  const topReactions = REACTIONS
    .filter(r => (counts[r.type as keyof ReactionCounts] ?? 0) > 0)
    .sort((a, b) => (counts[b.type as keyof ReactionCounts] ?? 0) - (counts[a.type as keyof ReactionCounts] ?? 0))
    .slice(0, 3)

  async function handleReact(type: string) {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    // Optimistic update
    const prev = { ...counts }
    const prevUR = userReaction
    const newCounts = { ...counts }

    if (userReaction === type) {
      // Remove
      newCounts[type as keyof ReactionCounts] = Math.max(0, (newCounts[type as keyof ReactionCounts] ?? 1) - 1)
      setUserReaction(null)
    } else {
      if (userReaction) {
        newCounts[userReaction as keyof ReactionCounts] = Math.max(0, (newCounts[userReaction as keyof ReactionCounts] ?? 1) - 1)
      }
      newCounts[type as keyof ReactionCounts] = (newCounts[type as keyof ReactionCounts] ?? 0) + 1
      setUserReaction(type)
    }
    setCounts(newCounts)
    onUpdate?.(newCounts, userReaction === type ? null : type)

    try {
      const res = await fetch('/api/social/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reactionType: type }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCounts(data.counts)
      setUserReaction(data.userReaction)
      onUpdate?.(data.counts, data.userReaction)
    } catch {
      setCounts(prev)
      setUserReaction(prevUR)
    }
  }

  if (!expanded && total > 0) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-full px-3 py-1.5 text-sm transition"
        >
          <span>{topReactions.map(r => r.emoji).join('')}</span>
          <span className="text-gray-300">{total}</span>
        </button>
        <button onClick={() => setExpanded(true)} className="text-xs text-gray-500 hover:text-gray-300 transition">
          React
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {REACTIONS.map(r => {
        const c = counts[r.type as keyof ReactionCounts] ?? 0
        const active = userReaction === r.type
        return (
          <button
            key={r.type}
            onClick={() => handleReact(r.type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition
              ${active
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 scale-105'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
              }`}
          >
            <span>{r.emoji}</span>
            <span>{r.label}</span>
            {c > 0 && <span className="text-xs opacity-70">{c}</span>}
          </button>
        )
      })}
      {total > 0 && (
        <button onClick={() => setExpanded(false)} className="text-xs text-gray-500 hover:text-gray-300 transition self-center">
          collapse
        </button>
      )}
    </div>
  )
}
