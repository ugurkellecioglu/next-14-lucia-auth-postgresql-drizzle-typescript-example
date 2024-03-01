ALTER TABLE "email_verification" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "email_verification" ADD COLUMN "sent_at" timestamp with time zone NOT NULL;