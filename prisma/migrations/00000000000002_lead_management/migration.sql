-- CreateEnum
CREATE TYPE "LeadOutcome" AS ENUM ('open', 'won', 'lost');

-- CreateEnum
CREATE TYPE "FactSource" AS ENUM ('ai', 'advisor', 'form', 'import', 'system');

-- CreateEnum
CREATE TYPE "AttributionChannel" AS ENUM ('ctwa_ad', 'organic_whatsapp', 'web_form', 'import', 'manual');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('received', 'processed', 'failed', 'ignored');

-- CreateEnum
CREATE TYPE "AssignmentReason" AS ENUM ('auto_equitable', 'auto_weighted', 'manual', 'campaign', 'fallback');

-- CreateEnum
CREATE TYPE "CapiEventStatus" AS ENUM ('pending', 'sent', 'failed', 'skipped');

-- AlterTable
ALTER TABLE "memberships" ADD COLUMN     "assignable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lead_weight" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notify_phone" TEXT,
ADD COLUMN     "schedule" JSONB;

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "attention_at" TIMESTAMP(3),
ADD COLUMN     "blocked_at" TIMESTAMP(3),
ADD COLUMN     "blocked_reason" TEXT,
ADD COLUMN     "bot_changed_at" TIMESTAMP(3),
ADD COLUMN     "bot_changed_by_membership_id" UUID,
ADD COLUMN     "bot_changed_reason" TEXT,
ADD COLUMN     "bot_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bsuid" TEXT,
ADD COLUMN     "first_contact_at" TIMESTAMP(3),
ADD COLUMN     "first_member_reply_at" TIMESTAMP(3),
ADD COLUMN     "last_inbound_at" TIMESTAMP(3),
ADD COLUMN     "last_outbound_at" TIMESTAMP(3),
ADD COLUMN     "outcome" "LeadOutcome" NOT NULL DEFAULT 'open',
ADD COLUMN     "outcome_reason" TEXT,
ADD COLUMN     "react_changed_at" TIMESTAMP(3),
ADD COLUMN     "react_changed_reason" TEXT,
ADD COLUMN     "react_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "stars" INTEGER,
ADD COLUMN     "sub_stage" TEXT,
ADD COLUMN     "wa_id" TEXT,
ADD COLUMN     "whatsapp_name" TEXT;

-- AlterTable
ALTER TABLE "channel_accounts" ADD COLUMN     "external_id" TEXT;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "error_code" TEXT,
ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "status_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "contact_facts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "source" "FactSource" NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "captured_by_membership_id" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_attributions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "channel" "AttributionChannel" NOT NULL,
    "platform" TEXT,
    "ad_id" TEXT,
    "adset_id" TEXT,
    "campaign_id" TEXT,
    "ad_name" TEXT,
    "campaign_name" TEXT,
    "source_type" TEXT,
    "source_url" TEXT,
    "headline" TEXT,
    "body" TEXT,
    "media_type" TEXT,
    "media_url" TEXT,
    "ctwa_clid" TEXT,
    "utm" JSONB,
    "is_first_touch" BOOLEAN NOT NULL DEFAULT false,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_attributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "provider" TEXT NOT NULL,
    "event_key" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'received',
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "from_membership_id" UUID,
    "to_membership_id" UUID,
    "reason" "AssignmentReason" NOT NULL,
    "actor_membership_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capi_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "contact_id" UUID,
    "trigger" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_time" TIMESTAMP(3) NOT NULL,
    "status" "CapiEventStatus" NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "response" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capi_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_insights_daily" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "ad_account_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "campaign_name" TEXT,
    "adset_id" TEXT,
    "ad_id" TEXT NOT NULL,
    "ad_name" TEXT,
    "spend" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversations_started" INTEGER NOT NULL DEFAULT 0,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_insights_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_facts_organization_id_key_idx" ON "contact_facts"("organization_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "contact_facts_contact_id_key_key" ON "contact_facts"("contact_id", "key");

-- CreateIndex
CREATE INDEX "lead_attributions_organization_id_ad_id_idx" ON "lead_attributions"("organization_id", "ad_id");

-- CreateIndex
CREATE INDEX "lead_attributions_organization_id_occurred_at_idx" ON "lead_attributions"("organization_id", "occurred_at");

-- CreateIndex
CREATE INDEX "lead_attributions_contact_id_idx" ON "lead_attributions"("contact_id");

-- CreateIndex
CREATE INDEX "webhook_events_status_received_at_idx" ON "webhook_events"("status", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_event_key_key" ON "webhook_events"("provider", "event_key");

-- CreateIndex
CREATE INDEX "assignment_logs_organization_id_created_at_idx" ON "assignment_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "assignment_logs_organization_id_to_membership_id_created_at_idx" ON "assignment_logs"("organization_id", "to_membership_id", "created_at");

-- CreateIndex
CREATE INDEX "assignment_logs_contact_id_idx" ON "assignment_logs"("contact_id");

-- CreateIndex
CREATE INDEX "capi_events_organization_id_created_at_idx" ON "capi_events"("organization_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "capi_events_organization_id_event_id_key" ON "capi_events"("organization_id", "event_id");

-- CreateIndex
CREATE INDEX "ad_insights_daily_organization_id_date_idx" ON "ad_insights_daily"("organization_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ad_insights_daily_organization_id_ad_id_date_key" ON "ad_insights_daily"("organization_id", "ad_id", "date");

-- CreateIndex
CREATE INDEX "contacts_organization_id_last_inbound_at_idx" ON "contacts"("organization_id", "last_inbound_at");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_organization_id_wa_id_key" ON "contacts"("organization_id", "wa_id");

-- CreateIndex
CREATE UNIQUE INDEX "channel_accounts_channel_external_id_key" ON "channel_accounts"("channel", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "messages_organization_id_external_id_key" ON "messages"("organization_id", "external_id");

-- AddForeignKey
ALTER TABLE "contact_facts" ADD CONSTRAINT "contact_facts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_facts" ADD CONSTRAINT "contact_facts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_attributions" ADD CONSTRAINT "lead_attributions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_attributions" ADD CONSTRAINT "lead_attributions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_logs" ADD CONSTRAINT "assignment_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_logs" ADD CONSTRAINT "assignment_logs_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capi_events" ADD CONSTRAINT "capi_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capi_events" ADD CONSTRAINT "capi_events_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_insights_daily" ADD CONSTRAINT "ad_insights_daily_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Row Level Security: same defense-in-depth policy as every tenant table (no anon/authenticated access).
ALTER TABLE "contact_facts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_attributions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhook_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assignment_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "capi_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ad_insights_daily" ENABLE ROW LEVEL SECURITY;
