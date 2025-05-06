CREATE TYPE "public"."account_type" AS ENUM('ISA', 'CISA', 'SIPP', 'LISA', 'GIA');--> statement-breakpoint
CREATE TABLE "asset_debits" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"value" real NOT NULL,
	"recorded_at" timestamp NOT NULL,
	"asset_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "asset_values" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"value" real NOT NULL,
	"recorded_at" timestamp NOT NULL,
	"asset_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "broker_provider_asset_api_key_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"broker_provider_asset_id" uuid NOT NULL,
	"api_key" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "broker_provider_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_type" text DEFAULT 'broker' NOT NULL,
	"name" text NOT NULL,
	"current_value" real DEFAULT 0 NOT NULL,
	"user_account_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"account_type" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "broker_provider_assets_name_unique" UNIQUE("name"),
	CONSTRAINT "asset_type_check" CHECK ("broker_provider_assets"."asset_type" = 'broker')
);
--> statement-breakpoint
CREATE TABLE "broker_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"supports_api_key" boolean DEFAULT false NOT NULL,
	"supported_account_types" "account_type"[] NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "broker_providers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "general_assets" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"asset_type" text DEFAULT 'general' NOT NULL,
	"name" text NOT NULL,
	"current_value" real DEFAULT 0 NOT NULL,
	"user_account_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "general_assets_name_unique" UNIQUE("name"),
	CONSTRAINT "asset_type_check" CHECK ("general_assets"."asset_type" = 'general')
);
--> statement-breakpoint
CREATE TABLE "user_account_broker_provider_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_account_id" uuid NOT NULL,
	"broker_provider_asset_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);

-- ENSURE ALL DEFAULT PROVIDERS ARE PRESENT
INSERT INTO "broker_providers" ("id", "name", "supports_api_key", "supported_account_types", "created_at", "updated_at") VALUES
  (gen_random_uuid(), 'Trading 212', false, ARRAY['ISA','CISA','SIPP','GIA']::account_type[], now(), now()),
  (gen_random_uuid(), 'Vanguard', false, ARRAY['ISA','CISA','SIPP','GIA']::account_type[], now(), now()),
  (gen_random_uuid(), 'InvestEngine', false, ARRAY['ISA','CISA','SIPP','GIA']::account_type[], now(), now()),
  (gen_random_uuid(), 'Hargreaves Lansdown', false, ARRAY['ISA','CISA','SIPP','LISA','GIA']::account_type[], now(), now()),
  (gen_random_uuid(), 'AJ Bell', false, ARRAY['ISA','CISA','SIPP','LISA','GIA']::account_type[], now(), now())
ON CONFLICT ("name") DO NOTHING;

--> statement-breakpoint
ALTER TABLE "account_history" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "accounts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "account_history" CASCADE;--> statement-breakpoint
DROP TABLE "accounts" CASCADE;--> statement-breakpoint
ALTER TABLE "milestones" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "fire_settings" ALTER COLUMN "target_retirement_age" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "fire_settings" ALTER COLUMN "annual_income_goal" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "fire_settings" ALTER COLUMN "expected_annual_return" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "fire_settings" ALTER COLUMN "safe_withdrawal_rate" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "fire_settings" ALTER COLUMN "monthly_investment" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "fire_settings" ALTER COLUMN "current_age" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "core_users" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "email_verifications" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "password_change_history" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "password_resets" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "phone_verifications" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_accounts" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "fire_settings" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "fire_settings" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "broker_provider_asset_api_key_connections" ADD CONSTRAINT "broker_provider_asset_api_key_connections_broker_provider_asset_id_broker_provider_assets_id_fk" FOREIGN KEY ("broker_provider_asset_id") REFERENCES "public"."broker_provider_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broker_provider_assets" ADD CONSTRAINT "broker_provider_assets_user_account_id_user_accounts_id_fk" FOREIGN KEY ("user_account_id") REFERENCES "public"."user_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broker_provider_assets" ADD CONSTRAINT "broker_provider_assets_provider_id_broker_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."broker_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general_assets" ADD CONSTRAINT "general_assets_user_account_id_user_accounts_id_fk" FOREIGN KEY ("user_account_id") REFERENCES "public"."user_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_account_broker_provider_assets" ADD CONSTRAINT "user_account_broker_provider_assets_user_account_id_user_accounts_id_fk" FOREIGN KEY ("user_account_id") REFERENCES "public"."user_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_account_broker_provider_assets" ADD CONSTRAINT "user_account_broker_provider_assets_broker_provider_asset_id_broker_provider_assets_id_fk" FOREIGN KEY ("broker_provider_asset_id") REFERENCES "public"."broker_provider_assets"("id") ON DELETE no action ON UPDATE no action;
