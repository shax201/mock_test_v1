ALTER TABLE "item_wise_tests"
  ADD COLUMN IF NOT EXISTS "writing_test_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "item_wise_tests" ALTER COLUMN "writing_test_ids" DROP DEFAULT;
