-- AlterEnum
ALTER TYPE "ListeningQuestionType" ADD VALUE 'TABLE_COMPLETION';

-- AlterTable
ALTER TABLE "listening_questions" ADD COLUMN     "answers" JSONB;
