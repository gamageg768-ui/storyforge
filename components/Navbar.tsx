'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, isLoggedIn } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`)
      setSearch('')
    }
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 font-playfair text-xl font-bold text-white shrink-0">
        📖 <span>StoryForge</span>
      </Link>

      {/* Trending link */}
      <Link href="/trending" className="hidden lg:block text-sm text-gray-400 hover:text-white transition shrink-0 ml-4">
        Trending
      </Link>

      {/* Search — hidden on mobile */}
      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm mx-6">
        <div className="relative w-full">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stories..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm">
            🔍
          </button>
        </div>
      </form>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          title="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {isLoggedIn ? (
          <>
            <Link
              href="/write"
              className="hidden sm:flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-lg transition font-medium"
            >
              ✍️ Write
            </Link>
            <Link
              href="/reading-list"
              className="hidden sm:flex p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
              title="My Library"
            >
              📚
            </Link>

            <NotificationBell />

            {/* User dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold transition hover:opacity-80"
                style={{ backgroundColor: user?.avatarColor || '#6366f1' }}
              >
                {(user?.name || 'U')[0].toUpperCase()}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-3 py-2 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                  <Link href={`/profile/${user?.id}`} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition">
                    👤 Profile
                  </Link>
                  <Link href="/write" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition">
                    ✍️ My Stories
                  </Link>
                  <Link href="/write/series" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition">
                    📚 My Series
                  </Link>
                  <Link href="/reading-list" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition">
                    🔖 Reading List
                  </Link>
                  <Link href="/analytics" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition">
                    📊 Analytics
                  </Link>
                  <Link href="/settings" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition">
                    ⚙️ Settings
                  </Link>
                  {user?.isAdmin && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-gray-700 transition">
                      🛡️ Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-gray-700">
                    <button
                      onClick={() => { signOut({ callbackUrl: '/' }); setMenuOpen(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-700 transition"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link href="/login" className="hidden sm:block text-sm text-gray-400 hover:text-white transition px-2 py-1">
              Sign In
            </Link>
            <Link href="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-lg transition font-medium">
              Get Started
            </Link>
          </>
        )}

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="sm:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-gray-900 border-b border-gray-800 p-4 flex flex-col gap-3 sm:hidden z-40">
          <form onSubmit={e => { handleSearch(e); setMobileOpen(false) }} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search stories..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
            />
            <button type="submit" className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm">🔍</button>
          </form>
          {isLoggedIn ? (
            <>
              <Link href="/trending" onClick={() => setMobileOpen(false)} className="text-sm text-gray-300">Trending</Link>
              <Link href="/write" onClick={() => setMobileOpen(false)} className="text-sm text-gray-300">✍️ Write</Link>
              <Link href="/reading-list" onClick={() => setMobileOpen(false)} className="text-sm text-gray-300">🔖 Library</Link>
              <Link href="/write/series" onClick={() => setMobileOpen(false)} className="text-sm text-gray-300">📚 My Series</Link>
              <Link href="/analytics" onClick={() => setMobileOpen(false)} className="text-sm text-gray-300">📊 Analytics</Link>
              <Link href="/settings" onClick={() => setMobileOpen(false)} className="text-sm text-gray-300">⚙️ Settings</Link>
              <Link href={`/profile/${user?.id}`} onClick={() => setMobileOpen(false)} className="text-sm text-gray-300">👤 Profile</Link>
              {user?.isAdmin && (
                <Link href="/admin" onClick={() => setMobileOpen(false)} className="text-sm text-amber-400">🛡️ Admin Panel</Link>
              )}
              <button onClick={() => { signOut({ callbackUrl: '/' }); setMobileOpen(false) }} className="text-sm text-red-400 text-left">🚪 Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="text-sm text-gray-300">Sign In</Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="text-sm text-indigo-400">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
