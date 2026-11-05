-- CreateEnum
CREATE TYPE "MatchResult" AS ENUM ('WIN', 'LOSE');

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "result" "MatchResult" NOT NULL,
    "bpEarned" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
