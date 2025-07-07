CREATE TABLE "broker_provider_asset_securities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"broker_provider_asset_id" uuid NOT NULL,
	"security_id" uuid NOT NULL,
	"share_holding" real NOT NULL,
	"gain_loss" real NOT NULL,
	"recorded_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "securities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"exchange" text,
	"country" text,
	"currency" text,
	"type" text,
	"isin" text,
	"cusip" text,
	"figi" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "broker_provider_asset_securities" ADD CONSTRAINT "broker_provider_asset_securities_broker_provider_asset_id_broker_provider_assets_id_fk" FOREIGN KEY ("broker_provider_asset_id") REFERENCES "public"."broker_provider_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broker_provider_asset_securities" ADD CONSTRAINT "broker_provider_asset_securities_security_id_securities_id_fk" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE no action ON UPDATE no action;