CREATE TYPE "public"."contribution_interval" AS ENUM('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TABLE "recurring_contributions" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"amount" real NOT NULL,
	"start_date" timestamp NOT NULL,
	"interval" "contribution_interval" NOT NULL,
	"last_processed_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
