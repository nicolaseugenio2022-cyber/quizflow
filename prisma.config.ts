import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Read lazily so `prisma generate` (run on install) works without a
    // database. Commands that connect fail clearly when it is missing.
    url: process.env.DATABASE_URL,
  },
});
