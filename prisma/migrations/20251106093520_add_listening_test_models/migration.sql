-- CreateEnum
CREATE TYPE "ListeningQuestionType" AS ENUM ('TEXT', 'RADIO', 'SELECT');

-- CreateTable
CREATE TABLE "listening_tests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'IELTS Listening Test',
    "audio_source" TEXT NOT NULL,
    "instructions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listening_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_parts" (
    "id" TEXT NOT NULL,
    "listening_test_id" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" JSONB NOT NULL,
    "sectionTitle" TEXT,
    "courseRequired" TEXT,
    "matchingHeading" TEXT,
    "matchingOptions" JSONB,
    "notesSections" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listening_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_questions" (
    "id" TEXT NOT NULL,
    "listening_part_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "type" "ListeningQuestionType" NOT NULL,
    "labelPrefix" TEXT,
    "textPrefix" TEXT,
    "textSuffix" TEXT,
    "questionText" TEXT,
    "options" JSONB,
    "matchingLabel" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listening_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_answers" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listening_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listening_parts_listening_test_id_index_key" ON "listening_parts"("listening_test_id", "index");

-- CreateIndex
CREATE UNIQUE INDEX "listening_questions_listening_part_id_number_key" ON "listening_questions"("listening_part_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "listening_answers_question_id_key" ON "listening_answers"("question_id");

-- AddForeignKey
ALTER TABLE "listening_parts" ADD CONSTRAINT "listening_parts_listening_test_id_fkey" FOREIGN KEY ("listening_test_id") REFERENCES "listening_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_questions" ADD CONSTRAINT "listening_questions_listening_part_id_fkey" FOREIGN KEY ("listening_part_id") REFERENCES "listening_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_answers" ADD CONSTRAINT "listening_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "listening_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
