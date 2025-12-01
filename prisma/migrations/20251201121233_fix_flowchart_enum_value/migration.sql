-- Add FLOW_CHART to ReadingQuestionType enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'FLOW_CHART' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ReadingQuestionType')
    ) THEN
        ALTER TYPE "ReadingQuestionType" ADD VALUE 'FLOW_CHART';
    END IF;
END $$;
