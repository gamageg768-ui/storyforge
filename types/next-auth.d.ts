import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id:          string
      name:        string
      email:       string
      avatarColor: string
      bio:         string
      isAdmin:     boolean
    }
  }
  interface User {
    id:          string
    name:        string
    email:       string
    avatarColor: string
    bio:         string
    isAdmin:     boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id:          string
    avatarColor: string
    bio:         string
    name:        string
    isAdmin:     boolean
  }
}
