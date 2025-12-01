-- AlterEnum
ALTER TYPE "ReadingQuestionType" ADD VALUE 'FLOWCHART';

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "logo_public_id" TEXT,
    "favicon_public_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);
