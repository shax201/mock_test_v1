-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'INSTRUCTOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('READING');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'FIB', 'MATCHING', 'TRUE_FALSE', 'NOT_GIVEN', 'TRUE_FALSE_NOT_GIVEN', 'NOTES_COMPLETION', 'SUMMARY_COMPLETION', 'MULTIPLE_CHOICE');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReadingQuestionType" AS ENUM ('MATCHING_HEADINGS', 'MATCHING_INFORMATION', 'TRUE_FALSE_NOT_GIVEN', 'SUMMARY_COMPLETION', 'MULTIPLE_CHOICE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "address" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_tests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL DEFAULT 40,
    "totalTimeMinutes" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passages" (
    "id" TEXT NOT NULL,
    "reading_test_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passage_contents" (
    "id" TEXT NOT NULL,
    "passage_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "passage_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "passage_id" TEXT NOT NULL,
    "question_number" INTEGER NOT NULL,
    "type" "ReadingQuestionType" NOT NULL,
    "question_text" TEXT NOT NULL,
    "options" JSONB,
    "headings_list" JSONB,
    "summary_text" TEXT,
    "sub_questions" JSONB,
    "points" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correct_answers" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correct_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_score_ranges" (
    "id" TEXT NOT NULL,
    "reading_test_id" TEXT NOT NULL,
    "min_score" INTEGER NOT NULL,
    "band" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "band_score_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passage_configs" (
    "id" TEXT NOT NULL,
    "reading_test_id" TEXT NOT NULL,
    "part" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "start" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passage_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_sessions" (
    "id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "test_type" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "answers" JSONB,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "score" INTEGER,
    "band" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_tests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "totalTimeMinutes" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "writing_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_passages" (
    "id" TEXT NOT NULL,
    "writing_test_id" TEXT NOT NULL,
    "passage" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "writing_passages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_questions" (
    "id" TEXT NOT NULL,
    "passage_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "writing_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "passage_contents_passage_id_content_id_key" ON "passage_contents"("passage_id", "content_id");

-- CreateIndex
CREATE UNIQUE INDEX "correct_answers_question_id_key" ON "correct_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "band_score_ranges_reading_test_id_min_score_key" ON "band_score_ranges"("reading_test_id", "min_score");

-- CreateIndex
CREATE UNIQUE INDEX "passage_configs_reading_test_id_part_key" ON "passage_configs"("reading_test_id", "part");

-- CreateIndex
CREATE UNIQUE INDEX "writing_questions_passage_id_key" ON "writing_questions"("passage_id");

-- AddForeignKey
ALTER TABLE "passages" ADD CONSTRAINT "passages_reading_test_id_fkey" FOREIGN KEY ("reading_test_id") REFERENCES "reading_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passage_contents" ADD CONSTRAINT "passage_contents_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "passages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "passages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correct_answers" ADD CONSTRAINT "correct_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_score_ranges" ADD CONSTRAINT "band_score_ranges_reading_test_id_fkey" FOREIGN KEY ("reading_test_id") REFERENCES "reading_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passage_configs" ADD CONSTRAINT "passage_configs_reading_test_id_fkey" FOREIGN KEY ("reading_test_id") REFERENCES "reading_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_sessions" ADD CONSTRAINT "test_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_passages" ADD CONSTRAINT "writing_passages_writing_test_id_fkey" FOREIGN KEY ("writing_test_id") REFERENCES "writing_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_questions" ADD CONSTRAINT "writing_questions_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "writing_passages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
