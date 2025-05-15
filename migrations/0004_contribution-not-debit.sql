CREATE TABLE "asset_contributions" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"value" real NOT NULL,
	"recorded_at" timestamp NOT NULL,
	"asset_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);

INSERT INTO "asset_contributions" (id, value, recorded_at, asset_id, created_at, updated_at)
SELECT id, value, recorded_at, asset_id, created_at, updated_at FROM "asset_debits";

--> statement-breakpoint
DROP TABLE "asset_debits" CASCADE;
