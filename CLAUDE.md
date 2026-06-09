# StoryForge — Project Reference

> Auto-loaded by Claude Code. Contains full project context — no need to read individual files at session start.

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14.2 — App Router; `'use client'` for interactive components |
| Auth | NextAuth v5 — `auth()` in route handlers, `useAuth()` in `contexts/AuthContext.tsx` |
| ORM | Prisma 5.22 + PostgreSQL (`lib/prisma.ts` singleton) |
| Email | Resend 6 (`lib/email.ts`) — `FROM = 'StoryForge <noreply@storyforge.app>'` |
| Storage | `@vercel/blob` for cover images (`BLOB_READ_WRITE_TOKEN` env var) |
| Styles | Tailwind CSS dark theme — `bg-gray-950` page, `bg-gray-900` cards, `indigo-600` primary, `border-gray-800` |
| Font | Playfair Display (`font-playfair`) for headings |
| Dev server | `npm run dev` (port 3000) · DB studio: `npm run db:studio` |

**Required env vars:** `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`

---

## 2. Database Models

| Model | Key fields | Unique / Index |
|---|---|---|
| User | id, username, email, passwordHash, bio, avatarColor, isAdmin, isBanned | username, email |
| Story | id, title, genre, authorId, status, coverColor, coverImage, tags | — |
| Chapter | id, storyId, title, content, **summary**, chapterOrder, isPublished, publishAt | — |
| StoryCollaborator | storyId, userId, role | [storyId, userId] |
| Reaction | userId, targetType, targetId, reactionType | [userId, targetType, targetId] |
| Comment | id, userId, storyId?, chapterId?, content, parentId?, paragraphIndex?, selectedText? | — |
| Follow | followerId, followingId | [followerId, followingId] |
| ReadingList | userId, storyId, status (`want_to_read`/`reading`/`completed`) | [userId, storyId] |
| Rating | userId, storyId, rating (1-5) | [userId, storyId] |
| Series | id, title, authorId | — |
| SeriesStory | seriesId, storyId, order | [seriesId, storyId] |
| Notification | userId, type, actorId?, storyId?, chapterId?, message, isRead | — |
| ChapterView | chapterId, userId?, viewedAt | — |
| RateLimit | key, count, expiresAt | key |
| ChapterDraft | chapterId, authorId, title, content | idx [chapterId, savedAt] |
| UserAchievement | userId, achievement | [userId, achievement] |
| **ReadChapter** | userId, chapterId, storyId, completedAt | [userId, chapterId] |
| **CommentLike** | userId, commentId | [userId, commentId] |
| **UserHighlight** | userId, chapterId, storyId, paragraphIndex, selectedText, note, color | idx [userId, chapterId] |
| **FeaturedStory** | storyId, category, displayOrder, addedById, expiresAt | [storyId, category] |
| **NotificationPreference** | userId, type, emailEnabled, inAppEnabled | [userId, type] |

**Bold = added in the 12-feature sprint. Migration is already applied.**

---

## 3. Implemented Features (all 12)

1. **Advanced Search** (`/search`) — faceted filters (genre, status, rating, chapter count), URL state. Navbar `/?search=` now redirects to `/search?q=`.
2. **Chapter Reading Progress** — `ReadChapter` upserted at 80% scroll (single-fire via `completedRef`). `GET /api/stories/[storyId]/progress` → `{readCount, totalCount, lastReadChapterId}`. Progress bar in TOC header (`StoryDetailClient.tsx`). "Ch. X/Y" pill in reading list.
3. **Comment Upvoting** — `CommentLike` toggled at `POST /api/social/comment/[id]/like`. Optimistic UI. Recent/Top sort in `CommentSection.tsx`.
4. **Private Highlights** — Two-step popover (choose → annotate OR highlight). 4 colors (yellow/green/blue/pink). Left-border paragraph indicator. 280px highlights panel in reader toolbar. `HIGHLIGHT_COLORS` + `highlightColorMap` in `ChapterReaderClient.tsx`.
5. **Chapter Summary / TOC** — `summary` field on Chapter. Textarea in both editor pages (max 300 chars). Collapsible TOC with chevron-expand in `StoryDetailClient.tsx`.
6. **Story Reading Stats** — total word count + estimated read time computed server-side in story detail API. Displayed in hero stats row (`📝 42k words · ⏱ ~3.5h read`).
7. **Time-Series Analytics Chart** — `GET /api/analytics/timeline?period=30d|90d|all`. Pure SVG component `components/ViewsLineChart.tsx` (viewBox 800×220). Period tabs in analytics page.
8. **Staff Picks / Featured** — `FeaturedStory` model. `GET /api/featured` (public). Admin "Featured" tab. Horizontal-scroll "Staff Picks" section on home page.
9. **Email Notifications** — `sendChapterNotifications()` in `lib/notifications.ts`. Triggered on draft→published transition in PUT/POST chapter routes. HTML template in `lib/email.ts`.
10. **Notification Preferences + `/settings`** — `NotificationPreference` model. Profile editor + 3×2 toggle grid (New Chapter / Comment / Follower × In-App / Email). CSS-only toggle switch. APIs at `/api/settings/profile` and `/api/settings/notifications`.
11. **Continue Reading Banner** — `GET /api/users/me/continue-reading` (up to 3 in-progress stories with next chapter). Horizontal-scroll strip on home for logged-in users with progress bars.
12. **Industry Audiobook Player** — `TTSPlayer.tsx` rewritten with paragraph chunking (fixes Chrome cut-off), `onActiveParagraph` callback for text-sync highlight, `startFromRef` for "Listen from here" per paragraph, skip controls, speed presets (0.75×–2×), sleep timer, mini-bar when collapsed.

---

## 4. API Routes

### Stories
- `GET/POST /api/stories` — list with filter params / create
- `GET/PUT/DELETE /api/stories/[storyId]` — GET includes `totalWordCount` + `estimatedReadMinutes`
- `GET/POST /api/stories/[storyId]/chapters`
- `GET/PUT/DELETE /api/stories/[storyId]/chapters/[chapterId]` — PUT fires `sendChapterNotifications` on publish transition
- `POST /api/stories/[storyId]/chapters/[chapterId]/complete` — upserts `ReadChapter`
- `GET /api/stories/[storyId]/progress` — `{ readCount, totalCount, lastReadChapterId }`
- `GET /api/stories/[storyId]/chapters/[chapterId]/view` — records `ChapterView`

### Social
- `GET/POST /api/social/comments`, `DELETE /api/social/comment/[id]`
- `POST /api/social/comment/[id]/like` — toggle `CommentLike`
- `GET/POST /api/social/reading-list`, `PUT /api/social/reading-list/[storyId]/status`
- `POST /api/social/follow/[userId]`
- `GET/PUT /api/social/reactions`

### User / Settings
- `GET /api/users/me`
- `GET /api/users/me/reading-list` — includes `readChapterCount` per story
- `GET /api/users/me/continue-reading` — up to 3 in-progress stories
- `GET /api/users/me/notifications`, `PUT /api/users/me/notifications/[id]`
- `GET/PUT /api/settings/profile`
- `GET/PUT /api/settings/notifications` — bulk upsert `NotificationPreference`

### Analytics
- `GET /api/analytics` — lifetime stats for author
- `GET /api/analytics/timeline?period=30d|90d|all`

### Highlights
- `GET /api/highlights?chapterId=X`
- `POST /api/highlights`
- `PATCH /api/highlights/[id]`
- `DELETE /api/highlights/[id]`

### Featured / Admin
- `GET /api/featured` — public, non-expired
- `GET/POST/DELETE /api/admin/featured`
- `GET/PUT /api/admin/stories/[id]`, `POST /api/admin/ban`, `GET/PUT /api/admin/reports`

### Auth
- `POST /api/auth/register`
- `GET /api/auth/[...nextauth]`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`

---

## 5. Components

| File | Purpose |
|---|---|
| `components/Navbar.tsx` | Top nav — search → `/search?q=…`, user dropdown has ⚙ Settings |
| `components/StoryCard.tsx` | Reusable story grid card |
| `components/CommentSection.tsx` | Nested comments, paragraph annotations, ▲ upvote, Recent/Top sort |
| `components/StarRating.tsx` | Read/write star rating |
| `components/ReactionBar.tsx` | Emoji reactions on stories/chapters |
| `components/NotificationBell.tsx` | Bell icon with unread count dropdown |
| `components/TTSPlayer.tsx` | Paragraph-chunked audiobook player (Feature 12) |
| `components/ViewsLineChart.tsx` | Pure SVG views-over-time chart (Feature 7) |

---

## 6. Key Lib Files

| File | Purpose |
|---|---|
| `lib/prisma.ts` | Prisma client singleton |
| `lib/auth.ts` | NextAuth config + `auth()` helper |
| `lib/email.ts` | `sendPasswordResetEmail`, `sendNewChapterEmail` via Resend |
| `lib/notifications.ts` | `sendChapterNotifications(authorId, storyId, storyTitle, chapterId, chapterTitle)` |
| `lib/achievements.ts` | 14 achievement triggers |
| `lib/rateLimit.ts` | DB-backed rate limiter using `RateLimit` model |
| `lib/hash.ts` | bcrypt wrapper |

---

## 7. Key Patterns

```ts
// Auth guard (all protected route handlers)
const session = await auth()
if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
const userId = Number(session.user.id)

// Admin guard
if (!session?.user?.isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 })

// Notification preference default (enabled when no row)
const enabled = pref ? pref.emailEnabled : true

// Chapter completion — 80% scroll, single-fire
if (scrollPercent >= 80 && !completedRef.current && isLoggedIn) {
  completedRef.current = true
  fetch(`/api/stories/${storyId}/chapters/${chapterId}/complete`, { method: 'POST' })
}

// Publish-transition detection in PUT handler
const before = await prisma.chapter.findUnique({ where: { id }, select: { isPublished: true } })
const updated = await prisma.chapter.update({ ... })
if (!before.isPublished && updated.isPublished) sendChapterNotifications(...).catch(() => {})

// Batch read counts — avoid N+1
const readCounts = await Promise.all(
  storyIds.map(sid => prisma.readChapter.count({ where: { userId, storyId: sid } }))
)

// Fire-and-forget (never blocks HTTP response)
sendChapterNotifications(...).catch(() => {})

// Highlight color O(1) lookup
const highlightColorMap = HIGHLIGHT_COLORS.reduce((acc, c) => ({ ...acc, [c.id]: c }), {})
```

**Other patterns:**
- URL-as-state in search: `router.replace('/search?' + params.toString())`
- `data-para-index` attribute on paragraphs — shared by TTS auto-scroll + annotation targeting
- CSS-only toggle switch: `peer` + `peer-checked:translate-x-4`
- Optimistic UI for comment likes: update local state immediately, revert on error

---

## 8. Pages

| Route | File | Auth |
|---|---|---|
| `/` | `app/page.tsx` | Optional (shows Continue Reading + Staff Picks when logged in) |
| `/search` | `app/search/page.tsx` | Public |
| `/trending` | `app/trending/page.tsx` | Public |
| `/stories/[storyId]` | `app/stories/[storyId]/StoryDetailClient.tsx` | Public |
| `/stories/[storyId]/chapters/[chapterId]` | `app/stories/[storyId]/chapters/[chapterId]/ChapterReaderClient.tsx` | Public |
| `/write/[storyId]` | `app/write/[storyId]/page.tsx` | Required |
| `/write/[storyId]/chapter` | `app/write/[storyId]/chapter/page.tsx` | Required |
| `/write/[storyId]/chapter/[chapterId]` | `app/write/[storyId]/chapter/[chapterId]/page.tsx` | Required |
| `/profile/[username]` | `app/profile/[username]/page.tsx` | Public |
| `/reading-list` | `app/reading-list/page.tsx` | Required |
| `/analytics` | `app/analytics/page.tsx` | Required (author) |
| `/settings` | `app/settings/page.tsx` | Required |
| `/admin` | `app/admin/page.tsx` | Required (isAdmin) |
| `/login` | `app/login/page.tsx` | Public |
| `/register` | `app/register/page.tsx` | Public |
