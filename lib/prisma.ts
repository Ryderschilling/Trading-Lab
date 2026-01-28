import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/trading_lab";
const urlWithPgbouncer = databaseUrl.includes("?") 
  ? `${databaseUrl}&pgbouncer=true` 
  : `${databaseUrl}?pgbouncer=true`;

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: urlWithPgbouncer
    }
  }
});