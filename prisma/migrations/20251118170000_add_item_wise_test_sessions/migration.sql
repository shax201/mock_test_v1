ALTER TABLE "test_sessions"
  ADD COLUMN IF NOT EXISTS "item_wise_test_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'test_sessions_item_wise_test_id_fkey'
  ) THEN
    ALTER TABLE "test_sessions"
      ADD CONSTRAINT "test_sessions_item_wise_test_id_fkey"
      FOREIGN KEY ("item_wise_test_id") REFERENCES "item_wise_tests"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
