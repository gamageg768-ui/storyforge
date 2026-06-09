export interface User {
  id:              number
  username:        string
  email?:          string
  bio:             string
  avatarColor:     string
  isAdmin?:        boolean
  isBanned?:       boolean
  createdAt:       string
  stories?:        Story[]
  collaborations?: Collaboration[]
  followersCount?: number
  followingCount?: number
  isFollowing?:    boolean
}

export interface Story {
  id:              number
  title:           string
  description:     string
  genre:           string
  authorId:        number
  authorName:      string
  authorColor:     string
  status:          'ongoing' | 'completed' | 'hiatus'
  coverColor:      string
  coverImage?:     string | null
  isAdult?:        boolean
  contentWarnings?: string
  tags:            string
  createdAt:       string
  updatedAt:       string
  chapterCount?:   number
  reactionCount?:  number
  commentCount?:   number
  avgRating?:            number | null
  ratingCount?:          number
  userRating?:           number | null
  userReaction?:         string | null
  inReadingList?:        boolean
  readingStatus?:        'want_to_read' | 'reading' | 'completed'
  totalWordCount?:       number
  estimatedReadMinutes?: number
  chapters?:       ChapterSummary[]
  collaborators?:  Collaborator[]
}

export interface ChapterSummary {
  id:           number
  title:        string
  chapterOrder: number
  createdAt:    string
  authorName:   string
  isPublished?: boolean
  publishAt?:   string | null
  summary?:     string
}

export interface Chapter extends ChapterSummary {
  content:     string
  storyId:     number
  authorId:    number
  avatarColor: string
  prevChapter: { id: number; title: string } | null
  nextChapter: { id: number; title: string } | null
}

export interface Collaborator {
  id:          number
  username:    string
  avatarColor: string
  role:        string
}

export interface Collaboration {
  id:         number
  title:      string
  coverColor: string
  genre:      string
  role:       string
  authorName: string
}

export interface Comment {
  id:             number
  userId:         number
  username:       string
  avatarColor:    string
  content:        string
  parentId:       number | null
  paragraphIndex: number | null
  selectedText:   string | null
  likeCount:      number
  userLiked:      boolean
  createdAt:      string
  replies:        Comment[]
}

export interface Notification {
  id:        number
  userId:    number
  type:      'new_follower' | 'new_comment' | 'new_chapter' | string
  actorId?:  number | null
  actorName?: string | null
  storyId?:  number | null
  chapterId?: number | null
  message:   string
  isRead:    boolean
  createdAt: string
}

export interface Series {
  id:          number
  title:       string
  description: string
  authorId:    number
  createdAt:   string
  author:      { id: number; username: string; avatarColor: string }
  stories:     { order: number; story: Partial<Story> }[]
}

export interface ReactionCounts {
  like?:  number
  love?:  number
  fire?:  number
  wow?:   number
  sad?:   number
}

export const GENRES = [
  'General','Romance','Fantasy','Sci-Fi','Mystery','Horror',
  'Adventure','Thriller','Drama','Poetry','Non-Fiction',
] as const

export const COVER_COLORS = [
  '#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6',
  '#ef4444','#14b8a6','#f97316','#84cc16','#06b6d4','#a855f7',
] as const

export const REACTIONS = [
  { type: 'like',  emoji: '👍', label: 'Like'  },
  { type: 'love',  emoji: '❤️',  label: 'Love'  },
  { type: 'fire',  emoji: '🔥', label: 'Fire'  },
  { type: 'wow',   emoji: '😮', label: 'Wow'   },
  { type: 'sad',   emoji: '😢', label: 'Sad'   },
] as const

export const AVATAR_COLORS = [
  '#6366f1','#ec4899','#f59e0b','#10b981',
  '#3b82f6','#8b5cf6','#ef4444','#14b8a6',
]

export const CONTENT_WARNINGS = [
  'Violence','Gore','Sexual content','Strong language','Drug use',
  'Self-harm','Abuse','Death','Trauma','Dark themes',
] as const
