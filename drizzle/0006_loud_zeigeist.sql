CREATE TABLE "match_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_a" text NOT NULL,
	"team_b" text NOT NULL,
	"sets_won_a" integer NOT NULL,
	"sets_won_b" integer NOT NULL,
	"sets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"video_url" text,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
