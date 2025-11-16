-- AlterEnum
ALTER TYPE "ListeningQuestionType" ADD VALUE 'FLOW_CHART';

-- AlterTable
ALTER TABLE "listening_questions" ADD COLUMN     "field" JSONB,
ADD COLUMN     "group_id" TEXT,
ADD COLUMN     "image_url" TEXT;
