'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetForm() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token') ?? ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return }
    setLoading(true)

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    setLoading(false)

    if (res.ok) {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2500)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to reset password')
    }
  }

  if (!token) return (
    <div className="text-center">
      <p className="text-red-400">Invalid reset link.</p>
      <Link href="/forgot-password" className="text-indigo-400 text-sm hover:underline mt-2 block">
        Request a new one
      </Link>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-900/30 border border-emerald-800 text-emerald-300 rounded-lg px-4 py-3 text-sm">
          Password updated! Redirecting to sign in…
        </div>
      )}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">New password</label>
        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Min. 6 characters"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Confirm password</label>
        <input
          type="password"
          required
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Repeat password"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
      </div>
      <button
        type="submit"
        disabled={loading || success}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
      >
        {loading ? 'Updating…' : 'Reset Password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-playfair text-2xl font-bold text-white">📖 StoryForge</Link>
          <h1 className="text-xl font-semibold text-white mt-4">Set a new password</h1>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <Suspense fallback={<p className="text-gray-400 text-sm">Loading…</p>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
