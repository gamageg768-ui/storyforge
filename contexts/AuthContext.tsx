'use client'

import { useSession } from 'next-auth/react'

export type AuthUser = {
  id:          string
  name:        string
  email:       string
  avatarColor: string
  bio:         string
  isAdmin:     boolean
}

export function useAuth() {
  const { data: session, status } = useSession()
  return {
    user:      (session?.user ?? null) as AuthUser | null,
    status,
    isLoggedIn: status === 'authenticated',
  }
}
