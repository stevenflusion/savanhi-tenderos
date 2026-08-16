CREATE TABLE "auth_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"user_id" uuid,
	"session_id" uuid,
	"family_id" uuid,
	"email_hash" text,
	"outcome" text NOT NULL,
	"reason" text,
	"request_id" text,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_normalized" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"consumed_at" timestamp with time zone,
	"locked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD COLUMN "refresh_token_hash" text;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD COLUMN "family_id" uuid;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD COLUMN "rotation" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD COLUMN "rotated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_normalized" text;--> statement-breakpoint
UPDATE "auth_sessions" SET "family_id" = gen_random_uuid(), "revoked_at" = COALESCE("revoked_at", now()), "rotated_at" = COALESCE("rotated_at", now()) WHERE "family_id" IS NULL;--> statement-breakpoint
ALTER TABLE "auth_sessions" ALTER COLUMN "family_id" SET NOT NULL;--> statement-breakpoint
UPDATE "users" SET "email_normalized" = lower(trim("email")) WHERE "email_normalized" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_normalized" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_events" ADD CONSTRAINT "auth_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_events" ADD CONSTRAINT "auth_events_session_id_auth_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."auth_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_events_type_idx" ON "auth_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "auth_events_user_idx" ON "auth_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_events_created_idx" ON "auth_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "otp_challenges_email_idx" ON "otp_challenges" USING btree ("email_normalized");--> statement-breakpoint
CREATE INDEX "otp_challenges_expiry_idx" ON "otp_challenges" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_family_idx" ON "auth_sessions" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_expiry_idx" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_refresh_token_hash_unique" UNIQUE("refresh_token_hash");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_normalized_unique" UNIQUE("email_normalized");
