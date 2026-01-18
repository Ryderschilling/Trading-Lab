-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tradeDate" TIMESTAMP(3) NOT NULL,
    "tradeTime" TEXT,
    "ticker" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "exitPrice" DOUBLE PRECISION,
    "quantity" INTEGER NOT NULL,
    "contracts" INTEGER,
    "totalInvested" DOUBLE PRECISION NOT NULL,
    "totalReturn" DOUBLE PRECISION NOT NULL,
    "percentReturn" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "option_metadata" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "strikePrice" DOUBLE PRECISION,
    "timeOfDay" TEXT,
    "dayOfWeek" TEXT,
    "is0DTE" BOOLEAN NOT NULL DEFAULT false,
    "isWeekly" BOOLEAN NOT NULL DEFAULT false,
    "isMonthly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "option_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_performance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "netPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tradeCount" INTEGER NOT NULL DEFAULT 0,
    "winCount" INTEGER NOT NULL DEFAULT 0,
    "lossCount" INTEGER NOT NULL DEFAULT 0,
    "totalVolume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgWin" DOUBLE PRECISION,
    "avgLoss" DOUBLE PRECISION,
    "largestWin" DOUBLE PRECISION,
    "largestLoss" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_performance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "netPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tradeCount" INTEGER NOT NULL DEFAULT 0,
    "winCount" INTEGER NOT NULL DEFAULT 0,
    "lossCount" INTEGER NOT NULL DEFAULT 0,
    "greenDays" INTEGER NOT NULL DEFAULT 0,
    "redDays" INTEGER NOT NULL DEFAULT 0,
    "bestDay" DOUBLE PRECISION,
    "worstDay" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aggregated_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgWin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgTradePnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profitFactor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bestTicker" TEXT,
    "worstTicker" TEXT,
    "largestWin" DOUBLE PRECISION,
    "largestLoss" DOUBLE PRECISION,
    "callsPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "putsPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stocksPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zeroDTEPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weeklyPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "morningPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "afternoonPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eveningPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mondayPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tuesdayPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wednesdayPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "thursdayPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fridayPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aggregated_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "timeframe" TEXT NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "breakfast" TEXT,
    "caffeine" TEXT,
    "sugar" TEXT,
    "hydration" TEXT,
    "sleepDuration" TEXT,
    "sleepQuality" TEXT,
    "bedtime" TEXT,
    "wakeFeeling" TEXT,
    "tradingQuality" TEXT,
    "revengeTrading" TEXT,
    "distractions" TEXT,
    "overtrading" TEXT,
    "timeSpentTrading" TEXT,
    "stoppedWhenShouldHave" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversation_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_conversation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_csv_rows" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tradeId" TEXT,
    "rowData" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_csv_rows_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "trades_userId_tradeDate_idx" ON "trades"("userId", "tradeDate");

-- CreateIndex
CREATE INDEX "trades_userId_ticker_idx" ON "trades"("userId", "ticker");

-- CreateIndex
CREATE INDEX "trades_userId_assetType_idx" ON "trades"("userId", "assetType");

-- CreateIndex
CREATE UNIQUE INDEX "option_metadata_tradeId_key" ON "option_metadata"("tradeId");

-- CreateIndex
CREATE INDEX "daily_performance_userId_date_idx" ON "daily_performance"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_performance_userId_date_key" ON "daily_performance"("userId", "date");

-- CreateIndex
CREATE INDEX "monthly_performance_userId_year_month_idx" ON "monthly_performance"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_performance_userId_year_month_key" ON "monthly_performance"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "aggregated_stats_userId_key" ON "aggregated_stats"("userId");

-- CreateIndex
CREATE INDEX "goals_userId_isActive_idx" ON "goals"("userId", "isActive");

-- CreateIndex
CREATE INDEX "journal_entries_userId_date_idx" ON "journal_entries"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_userId_date_key" ON "journal_entries"("userId", "date");

-- CreateIndex
CREATE INDEX "ai_conversation_history_userId_createdAt_idx" ON "ai_conversation_history"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "raw_csv_rows_tradeId_key" ON "raw_csv_rows"("tradeId");

-- CreateIndex
CREATE INDEX "raw_csv_rows_userId_uploadedAt_idx" ON "raw_csv_rows"("userId", "uploadedAt");

-- CreateIndex
CREATE INDEX "broker_executions_userId_activityDate_idx" ON "broker_executions"("userId", "activityDate");

-- CreateIndex
CREATE INDEX "broker_executions_userId_broker_idx" ON "broker_executions"("userId", "broker");

-- CreateIndex
CREATE INDEX "broker_executions_userId_instrument_idx" ON "broker_executions"("userId", "instrument");

-- CreateIndex
CREATE INDEX "broker_executions_userId_transactionType_idx" ON "broker_executions"("userId", "transactionType");

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_metadata" ADD CONSTRAINT "option_metadata_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_performance" ADD CONSTRAINT "daily_performance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_performance" ADD CONSTRAINT "monthly_performance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aggregated_stats" ADD CONSTRAINT "aggregated_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversation_history" ADD CONSTRAINT "ai_conversation_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_csv_rows" ADD CONSTRAINT "raw_csv_rows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_csv_rows" ADD CONSTRAINT "raw_csv_rows_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_executions" ADD CONSTRAINT "broker_executions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
