ALTER TABLE "poll_options" ADD COLUMN "date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "poll_options" ADD COLUMN "time" time;--> statement-breakpoint
ALTER TABLE "poll_options" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" DROP COLUMN "score_us";--> statement-breakpoint
ALTER TABLE "matches" DROP COLUMN "score_them";--> statement-breakpoint
ALTER TABLE "matches" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "poll_options" DROP COLUMN "label";--> statement-breakpoint
ALTER TABLE "poll_options" DROP COLUMN "position";--> statement-breakpoint
ALTER TABLE "polls" DROP COLUMN "closes_at";--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_poll_user_unique" UNIQUE("poll_id","user_id");