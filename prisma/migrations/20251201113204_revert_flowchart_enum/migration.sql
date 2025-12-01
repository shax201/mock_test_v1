/*
  Warnings:

  - The values [FLOWCHART] on the enum `ReadingQuestionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReadingQuestionType_new" AS ENUM ('MATCHING_HEADINGS', 'MATCHING_INFORMATION', 'TRUE_FALSE_NOT_GIVEN', 'SUMMARY_COMPLETION', 'MULTIPLE_CHOICE');
ALTER TABLE "questions" ALTER COLUMN "type" TYPE "ReadingQuestionType_new" USING ("type"::text::"ReadingQuestionType_new");
ALTER TYPE "ReadingQuestionType" RENAME TO "ReadingQuestionType_old";
ALTER TYPE "ReadingQuestionType_new" RENAME TO "ReadingQuestionType";
DROP TYPE "ReadingQuestionType_old";
COMMIT;
