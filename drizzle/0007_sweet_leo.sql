CREATE TABLE "teams" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "logo_url" text,
  CONSTRAINT "teams_name_unique" UNIQUE("name"),
  CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);

--> statement-breakpoint

DROP TABLE "match_results";

--> statement-breakpoint

CREATE TABLE "match_results" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_a_id" integer NOT NULL,
  "team_b_id" integer NOT NULL,
  "sets_won_a" integer NOT NULL,
  "sets_won_b" integer NOT NULL,
  "sets" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "video_url" text,
  "played_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "match_results_team_a_id_teams_id_fk"
    FOREIGN KEY ("team_a_id")
    REFERENCES "public"."teams"("id")
    ON DELETE no action
    ON UPDATE no action,
  CONSTRAINT "match_results_team_b_id_teams_id_fk"
    FOREIGN KEY ("team_b_id")
    REFERENCES "public"."teams"("id")
    ON DELETE no action
    ON UPDATE no action
);