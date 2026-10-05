ALTER TABLE "votes" DROP CONSTRAINT "votes_poll_user_unique";--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_option_user_unique" UNIQUE("option_id","user_id");