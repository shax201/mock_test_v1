-- CreateTable
CREATE TABLE "writing_passage_configs" (
    "id" TEXT NOT NULL,
    "writing_test_id" TEXT NOT NULL,
    "part" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "start" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "writing_passage_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "writing_passage_configs_writing_test_id_part_key" ON "writing_passage_configs"("writing_test_id", "part");

-- AddForeignKey
ALTER TABLE "writing_passage_configs" ADD CONSTRAINT "writing_passage_configs_writing_test_id_fkey" FOREIGN KEY ("writing_test_id") REFERENCES "writing_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
