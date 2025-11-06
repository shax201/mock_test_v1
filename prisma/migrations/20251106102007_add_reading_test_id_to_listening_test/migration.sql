-- AlterTable
ALTER TABLE "listening_tests" ADD COLUMN     "reading_test_id" TEXT;

-- AddForeignKey
ALTER TABLE "listening_tests" ADD CONSTRAINT "listening_tests_reading_test_id_fkey" FOREIGN KEY ("reading_test_id") REFERENCES "reading_tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
