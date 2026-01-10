-- Safe migration script to create broker_executions table
-- Run this manually on your database if the table doesn't exist yet
-- This script checks if the table exists before creating it

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'broker_executions'
    ) THEN
        CREATE TABLE "broker_executions" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "broker" TEXT NOT NULL,
            "activityDate" DATE NOT NULL,
            "instrument" TEXT NOT NULL,
            "description" TEXT,
            "transactionType" TEXT NOT NULL,
            "quantity" DOUBLE PRECISION NOT NULL,
            "price" DOUBLE PRECISION NOT NULL,
            "amount" DOUBLE PRECISION NOT NULL,
            "rawRowData" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "broker_executions_pkey" PRIMARY KEY ("id")
        );

        CREATE INDEX "broker_executions_userId_activityDate_idx" ON "broker_executions"("userId", "activityDate");
        CREATE INDEX "broker_executions_userId_broker_idx" ON "broker_executions"("userId", "broker");
        CREATE INDEX "broker_executions_userId_instrument_idx" ON "broker_executions"("userId", "instrument");
        CREATE INDEX "broker_executions_userId_transactionType_idx" ON "broker_executions"("userId", "transactionType");

        ALTER TABLE "broker_executions" ADD CONSTRAINT "broker_executions_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

        RAISE NOTICE 'broker_executions table created successfully';
    ELSE
        RAISE NOTICE 'broker_executions table already exists, skipping creation';
    END IF;
END $$;

