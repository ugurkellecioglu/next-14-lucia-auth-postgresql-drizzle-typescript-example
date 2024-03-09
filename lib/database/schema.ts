import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  hashedPassword: text("hashed_password"),
  email: text("email").unique(),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  profilePictureUrl: text("profile_picture_url"),
  name: text("name"),
})

export const oauthAccountTable = pgTable("oauth_account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  provider: text("provider").notNull(), // google, github
  providerUserId: text("provider_user_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }),
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
