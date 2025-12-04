-- AlterTable
ALTER TABLE "listening_parts" ADD COLUMN "matching_information_options" JSONB;

-- AlterEnum
ALTER TYPE "ListeningQuestionType" ADD VALUE 'MATCHING_INFORMATION';
