/*
  Warnings:

  - You are about to drop the column `passage` on the `writing_passages` table. All the data in the column will be lost.
  - Added the required column `title` to the `writing_passages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question_number` to the `writing_questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `writing_questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reading_test_id` to the `writing_tests` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WritingQuestionType" AS ENUM ('TASK_1', 'TASK_2');

-- DropIndex
DROP INDEX "writing_questions_passage_id_key";

-- AlterTable
ALTER TABLE "writing_passages" DROP COLUMN "passage",
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "writing_questions" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "question_number" INTEGER NOT NULL,
ADD COLUMN     "reading_passage_id" TEXT,
ADD COLUMN     "type" "WritingQuestionType" NOT NULL;

-- AlterTable
ALTER TABLE "writing_tests" ADD COLUMN     "reading_test_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "writing_passage_contents" (
    "id" TEXT NOT NULL,
    "passage_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "writing_passage_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "writing_passage_contents_passage_id_content_id_key" ON "writing_passage_contents"("passage_id", "content_id");

-- AddForeignKey
ALTER TABLE "writing_tests" ADD CONSTRAINT "writing_tests_reading_test_id_fkey" FOREIGN KEY ("reading_test_id") REFERENCES "reading_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_passage_contents" ADD CONSTRAINT "writing_passage_contents_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "writing_passages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_questions" ADD CONSTRAINT "writing_questions_reading_passage_id_fkey" FOREIGN KEY ("reading_passage_id") REFERENCES "passages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
