'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { AVATAR_COLORS } from '@/types'

interface NotifPref {
  type:         string
  emailEnabled:  boolean
  inAppEnabled: boolean
}

const TYPE_LABELS: Record<string, string> = {
  new_chapter:  'New Chapter',
  new_comment:  'New Comment',
  new_follower: 'New Follower',
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? 'bg-indigo-600' : 'bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const { isLoggedIn } = useAuth()
  const router = useRouter()

  // Profile state
  const [username,    setUsername]    = useState('')
  const [bio,         setBio]         = useState('')
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0])
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg,  setProfileMsg]  = useState('')

  // Notification prefs state
  const [prefs,        setPrefs]       = useState<NotifPref[]>([])
  const [prefsSaving,  setPrefsSaving] = useState(false)
  const [prefsMsg,     setPrefsMsg]    = useState('')
  const [prefsLoading, setPrefsLoading]= useState(true)

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return }

    fetch('/api/settings/profile')
      .then(r => r.json())
      .then(d => { setUsername(d.username || ''); setBio(d.bio || ''); setAvatarColor(d.avatarColor || AVATAR_COLORS[0]) })
      .catch(() => {})

    fetch('/api/settings/notifications')
      .then(r => r.json())
      .then((d: NotifPref[]) => { setPrefs(d); setPrefsLoading(false) })
      .catch(() => { setPrefsLoading(false) })
  }, [isLoggedIn, router])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg('')
    const res = await fetch('/api/settings/profile', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, bio, avatarColor }),
    })
    if (res.ok) {
      setProfileMsg('Profile updated!')
    } else {
      const data = await res.json()
      setProfileMsg(data.error || 'Failed to save')
    }
    setProfileSaving(false)
  }

  function togglePref(type: string, field: 'emailEnabled' | 'inAppEnabled') {
    setPrefs(prev => prev.map(p =>
      p.type === type ? { ...p, [field]: !p[field] } : p
    ))
  }

  async function savePrefs() {
    setPrefsSaving(true)
    setPrefsMsg('')
    const res = await fetch('/api/settings/notifications', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(prefs),
    })
    setPrefsMsg(res.ok ? 'Preferences saved!' : 'Failed to save')
    setPrefsSaving(false)
  }

  if (!isLoggedIn) return null

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-white mb-1">Settings</h1>
          <p className="text-gray-400">Manage your profile and notification preferences.</p>
        </div>

        {/* Profile */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Profile</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                placeholder="Tell readers about yourself…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Avatar Color</label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className="w-8 h-8 rounded-full transition ring-offset-2 ring-offset-gray-900"
                    style={{
                      backgroundColor: c,
                      outline: avatarColor === c ? `2px solid ${c}` : 'none',
                      outlineOffset: '2px',
                      boxShadow: avatarColor === c ? `0 0 0 3px #6366f1` : 'none',
                    }}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: avatarColor }}
                >
                  {(username[0] || 'U').toUpperCase()}
                </div>
                <span className="text-sm text-gray-400">Preview</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={profileSaving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm transition"
              >
                {profileSaving ? 'Saving…' : 'Save Profile'}
              </button>
              {profileMsg && (
                <span className={`text-sm ${profileMsg.includes('!') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {profileMsg}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Notifications */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Notifications</h2>
          <p className="text-gray-500 text-sm mb-5">Choose which notifications you receive.</p>

          {prefsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header row */}
              <div className="flex items-center gap-4">
                <div className="flex-1" />
                <span className="text-xs text-gray-500 w-16 text-center">In-App</span>
                <span className="text-xs text-gray-500 w-16 text-center">Email</span>
              </div>
              {prefs.map(p => (
                <div key={p.type} className="flex items-center gap-4 py-2 border-t border-gray-800">
                  <div className="flex-1">
                    <p className="text-sm text-gray-200">{TYPE_LABELS[p.type] ?? p.type}</p>
                  </div>
                  <div className="w-16 flex justify-center">
                    <Toggle
                      checked={p.inAppEnabled}
                      onChange={() => togglePref(p.type, 'inAppEnabled')}
                    />
                  </div>
                  <div className="w-16 flex justify-center">
                    <Toggle
                      checked={p.emailEnabled}
                      onChange={() => togglePref(p.type, 'emailEnabled')}
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={savePrefs}
                  disabled={prefsSaving}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm transition"
                >
                  {prefsSaving ? 'Saving…' : 'Save Preferences'}
                </button>
                {prefsMsg && (
                  <span className={`text-sm ${prefsMsg.includes('!') ? 'text-emerald-400' : 'text-red-400'}`}>
                    {prefsMsg}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
