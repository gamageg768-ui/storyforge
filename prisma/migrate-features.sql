-- Feature 5: Reading Challenges
CREATE TABLE "ReadingChallenge" (
  "id"          SERIAL PRIMARY KEY,
  "title"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "goal"        INTEGER NOT NULL,
  "goalType"    TEXT NOT NULL,
  "startDate"   TIMESTAMP(3) NOT NULL,
  "endDate"     TIMESTAMP(3) NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ChallengeEntry" (
  "id"          SERIAL PRIMARY KEY,
  "userId"      INTEGER NOT NULL,
  "challengeId" INTEGER NOT NULL,
  "progress"    INTEGER NOT NULL DEFAULT 0,
  "joinedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChallengeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "ChallengeEntry_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "ReadingChallenge"("id") ON DELETE CASCADE,
  CONSTRAINT "ChallengeEntry_userId_challengeId_key" UNIQUE ("userId", "challengeId")
);

-- Feature 6: Story Collections / Shelves
CREATE TABLE "Shelf" (
  "id"          SERIAL PRIMARY KEY,
  "userId"      INTEGER NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "isPublic"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Shelf_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "ShelfStory" (
  "shelfId" INTEGER NOT NULL,
  "storyId" INTEGER NOT NULL,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShelfStory_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelf"("id") ON DELETE CASCADE,
  CONSTRAINT "ShelfStory_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE,
  CONSTRAINT "ShelfStory_shelfId_storyId_key" UNIQUE ("shelfId", "storyId")
);

-- Feature 13: Social Reading Rooms
CREATE TABLE "ReadingRoom" (
  "id"        SERIAL PRIMARY KEY,
  "code"      TEXT NOT NULL UNIQUE,
  "storyId"   INTEGER NOT NULL,
  "chapterId" INTEGER NOT NULL,
  "hostId"    INTEGER NOT NULL,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReadingRoom_hostId_fkey"    FOREIGN KEY ("hostId")    REFERENCES "User"("id"),
  CONSTRAINT "ReadingRoom_storyId_fkey"   FOREIGN KEY ("storyId")   REFERENCES "Story"("id"),
  CONSTRAINT "ReadingRoom_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id")
);

CREATE TABLE "ReadingRoomParticipant" (
  "id"              SERIAL PRIMARY KEY,
  "roomId"          INTEGER NOT NULL,
  "userId"          INTEGER NOT NULL,
  "cursorParagraph" INTEGER NOT NULL DEFAULT 0,
  "lastSeen"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReadingRoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ReadingRoom"("id") ON DELETE CASCADE,
  CONSTRAINT "ReadingRoomParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id"),
  CONSTRAINT "ReadingRoomParticipant_roomId_userId_key" UNIQUE ("roomId", "userId")
);

CREATE TABLE "ReadingRoomMessage" (
  "id"        SERIAL PRIMARY KEY,
  "roomId"    INTEGER NOT NULL,
  "userId"    INTEGER NOT NULL,
  "content"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReadingRoomMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ReadingRoom"("id") ON DELETE CASCADE,
  CONSTRAINT "ReadingRoomMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
);

-- Feature 1: Author Tip Jar
CREATE TABLE "TipTransaction" (
  "id"              SERIAL PRIMARY KEY,
  "fromUserId"      INTEGER NOT NULL,
  "toAuthorId"      INTEGER NOT NULL,
  "amount"          INTEGER NOT NULL,
  "currency"        TEXT NOT NULL DEFAULT 'usd',
  "message"         TEXT NOT NULL DEFAULT '',
  "stripeSessionId" TEXT NOT NULL UNIQUE,
  "status"          TEXT NOT NULL DEFAULT 'pending',
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TipTransaction_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id"),
  CONSTRAINT "TipTransaction_toAuthorId_fkey" FOREIGN KEY ("toAuthorId") REFERENCES "User"("id")
);

-- Feature 2: Supporter Tiers & Subscriptions
CREATE TABLE "SupporterTier" (
  "id"              SERIAL PRIMARY KEY,
  "authorId"        INTEGER NOT NULL UNIQUE,
  "name"            TEXT NOT NULL,
  "description"     TEXT NOT NULL DEFAULT '',
  "priceMonthly"    INTEGER NOT NULL,
  "earlyAccessDays" INTEGER NOT NULL DEFAULT 7,
  "stripePriceId"   TEXT NOT NULL UNIQUE,
  "stripeProductId" TEXT NOT NULL,
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupporterTier_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id")
);

CREATE TABLE "SupporterSubscription" (
  "id"                   SERIAL PRIMARY KEY,
  "userId"               INTEGER NOT NULL,
  "tierId"               INTEGER NOT NULL,
  "stripeSubscriptionId" TEXT NOT NULL UNIQUE,
  "stripeCustomerId"     TEXT NOT NULL,
  "status"               TEXT NOT NULL DEFAULT 'active',
  "currentPeriodEnd"     TIMESTAMP(3) NOT NULL,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupporterSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id"),
  CONSTRAINT "SupporterSubscription_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "SupporterTier"("id")
);

-- Feature 3: Commission Board
CREATE TABLE "CommissionListing" (
  "id"          SERIAL PRIMARY KEY,
  "authorId"    INTEGER NOT NULL UNIQUE,
  "title"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priceMin"    INTEGER NOT NULL DEFAULT 0,
  "priceMax"    INTEGER NOT NULL DEFAULT 0,
  "genres"      TEXT NOT NULL DEFAULT '',
  "turnaround"  TEXT NOT NULL DEFAULT '',
  "isOpen"      BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommissionListing_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id")
);

CREATE TABLE "CommissionRequest" (
  "id"          SERIAL PRIMARY KEY,
  "userId"      INTEGER NOT NULL,
  "authorId"    INTEGER NOT NULL,
  "listingId"   INTEGER,
  "title"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "budget"      INTEGER NOT NULL DEFAULT 0,
  "status"      TEXT NOT NULL DEFAULT 'pending',
  "authorNote"  TEXT NOT NULL DEFAULT '',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommissionRequest_userId_fkey"    FOREIGN KEY ("userId")    REFERENCES "User"("id"),
  CONSTRAINT "CommissionRequest_authorId_fkey"  FOREIGN KEY ("authorId")  REFERENCES "User"("id"),
  CONSTRAINT "CommissionRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CommissionListing"("id")
);
