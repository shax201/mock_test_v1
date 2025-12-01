-- AlterEnum
ALTER TYPE "ReadingQuestionType" ADD VALUE 'FLOW_CHART';

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "field" JSONB,
ADD COLUMN     "fields" JSONB,
ADD COLUMN     "image_url" TEXT;
