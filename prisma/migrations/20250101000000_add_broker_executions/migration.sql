-- CreateTable
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

-- CreateIndex
CREATE INDEX "broker_executions_userId_activityDate_idx" ON "broker_executions"("userId", "activityDate");

-- CreateIndex
CREATE INDEX "broker_executions_userId_broker_idx" ON "broker_executions"("userId", "broker");

-- CreateIndex
CREATE INDEX "broker_executions_userId_instrument_idx" ON "broker_executions"("userId", "instrument");

-- CreateIndex
CREATE INDEX "broker_executions_userId_transactionType_idx" ON "broker_executions"("userId", "transactionType");

-- AddForeignKey
ALTER TABLE "broker_executions" ADD CONSTRAINT "broker_executions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

