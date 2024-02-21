import { defineConfig } from "drizzle-kit"
export default defineConfig({
  schema: "./lib/database/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DB_URL!,
  },
  verbose: true,
  strict: true,
})
