-- CreateEnum
CREATE TYPE "ItemWiseTestType" AS ENUM ('ITEM_WISE_TEST');

-- CreateEnum
CREATE TYPE "ItemWiseTestQuestionType" AS ENUM ('FLOW_CHART_COMPLETION');

-- CreateTable
CREATE TABLE "item_wise_tests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "testType" "ItemWiseTestType" NOT NULL,
    "questionType" "ItemWiseTestQuestionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reading_test_ids" TEXT[],
    "listening_test_ids" TEXT[],

    CONSTRAINT "item_wise_tests_pkey" PRIMARY KEY ("id")
);
