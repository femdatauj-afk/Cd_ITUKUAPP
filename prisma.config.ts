import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "server/prisma/schema.prisma",
  migrations: {
    path: "server/prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://itukuapp_user:itukuapp_password@localhost:55432/itukuapp_db?schema=public",
  },
});