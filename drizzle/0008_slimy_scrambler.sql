ALTER TABLE "user" ADD COLUMN "profile_picture_url" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "oauth_account" DROP COLUMN IF EXISTS "profile_picture_url";--> statement-breakpoint
ALTER TABLE "oauth_account" DROP COLUMN IF EXISTS "name";