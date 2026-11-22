-- Instagram Direct + Facebook Messenger leads (Phase 29). Additive only.
ALTER TYPE "AttributionChannel" ADD VALUE IF NOT EXISTS 'messenger_ad';
ALTER TYPE "AttributionChannel" ADD VALUE IF NOT EXISTS 'instagram_ad';
ALTER TYPE "AttributionChannel" ADD VALUE IF NOT EXISTS 'organic_messenger';
ALTER TYPE "AttributionChannel" ADD VALUE IF NOT EXISTS 'organic_instagram';

-- Conversation lookup by channel + platform-scoped sender id (PSID / IGSID / wa_id).
CREATE INDEX IF NOT EXISTS "conversations_channel_account_id_external_id_idx" ON "conversations"("channel_account_id", "external_id");
