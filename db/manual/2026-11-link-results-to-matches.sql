-- Links match_results to matches (one result per scheduled match).
-- Only ADDS a nullable column + constraints – no data is changed or deleted.
-- Safe to run more than once.
--
-- Local:  docker compose exec -T db psql -U volley -d volleyball < db/manual/2026-11-link-results-to-matches.sql
-- Prod:   docker compose exec -T db psql "$PROD_DB_URL" < db/manual/2026-11-link-results-to-matches.sql
--
-- (Run this instead of `drizzle-kit push` for this change: push asks
--  "Do you want to truncate match_results table?" – answering yes deletes all results.)

BEGIN;

ALTER TABLE "match_results" ADD COLUMN IF NOT EXISTS "match_id" uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'match_results_match_id_unique') THEN
    ALTER TABLE "match_results"
      ADD CONSTRAINT "match_results_match_id_unique" UNIQUE ("match_id");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'match_results_match_id_matches_id_fk') THEN
    ALTER TABLE "match_results"
      ADD CONSTRAINT "match_results_match_id_matches_id_fk"
      FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

COMMIT;
