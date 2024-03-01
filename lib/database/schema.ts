import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  hashedPassword: text("hashed_password"),
  email: text("email").unique().notNull(),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
})

export const emailVerificationTable = pgTable("email_verification", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  code: text("code").notNull(),
  sentAt: timestamp("sent_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
})

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
})
