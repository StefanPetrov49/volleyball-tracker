-- "Последни промени" on /admin (db/schema.ts → activityLog).
-- Only CREATES a new, empty table – nothing existing is changed. Safe to run more than once.
--
-- Local:  docker compose exec -T db psql -U volley -d volleyball < db/manual/2026-11-activity-log.sql
-- Prod:   docker compose exec -T db psql "$PROD_DB_URL" < db/manual/2026-11-activity-log.sql
--
-- Run it before deploying. (If you forget, the site still works – changes just aren't logged.)

BEGIN;

CREATE TABLE IF NOT EXISTS "activity_log" (
  "id" serial PRIMARY KEY NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "actor_id" text,
  "actor_name" text NOT NULL,
  "action" text NOT NULL,
  "summary" text NOT NULL,
  "href" text
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_log_actor_id_user_id_fk') THEN
    ALTER TABLE "activity_log"
      ADD CONSTRAINT "activity_log_actor_id_user_id_fk"
      FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "activity_log_created_at_idx" ON "activity_log" USING btree ("created_at");

COMMIT;
