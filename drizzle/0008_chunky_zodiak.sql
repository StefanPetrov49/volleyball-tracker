ALTER TABLE "poll_options" ALTER COLUMN "date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "poll_options" ADD COLUMN "label" text;--> statement-breakpoint
ALTER TABLE "poll_options" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;