-- AlterTable
ALTER TABLE "public"."Folder" ADD COLUMN     "currentTrackIndex" INTEGER,
ADD COLUMN     "isQueueActive" BOOLEAN,
ADD COLUMN     "musicQueue" JSONB;
