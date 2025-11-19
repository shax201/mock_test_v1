DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ItemWiseModuleType') THEN
    CREATE TYPE "ItemWiseModuleType" AS ENUM ('READING', 'LISTENING');
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'ItemWiseModuleType'
      AND e.enumlabel = 'WRITING'
  ) THEN
    ALTER TYPE "ItemWiseModuleType" ADD VALUE 'WRITING';
  END IF;
END $$;

ALTER TABLE "item_wise_tests"
  ADD COLUMN IF NOT EXISTS "module_type" "ItemWiseModuleType" NOT NULL DEFAULT 'READING',
  ADD COLUMN IF NOT EXISTS "writing_test_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
