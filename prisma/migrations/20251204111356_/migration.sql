/*
  Warnings:

  - The values [MULTIPLE_CHOICE] on the enum `ListeningQuestionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ListeningQuestionType_new" AS ENUM ('TEXT', 'RADIO', 'SELECT', 'FLOW_CHART', 'TABLE_COMPLETION', 'MATCHING_INFORMATION');
ALTER TABLE "listening_questions" ALTER COLUMN "type" TYPE "ListeningQuestionType_new" USING ("type"::text::"ListeningQuestionType_new");
ALTER TYPE "ListeningQuestionType" RENAME TO "ListeningQuestionType_old";
ALTER TYPE "ListeningQuestionType_new" RENAME TO "ListeningQuestionType";
DROP TYPE "ListeningQuestionType_old";
COMMIT;
