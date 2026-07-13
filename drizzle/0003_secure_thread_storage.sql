-- Existing timestamp-without-time-zone values were written from JavaScript Date
-- values and are interpreted as UTC during this migration.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "session" s
    LEFT JOIN "user" u ON u."id" = s."user_id"
    WHERE u."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add session.user_id foreign key: orphaned sessions exist';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "account" a
    LEFT JOIN "user" u ON u."id" = a."user_id"
    WHERE u."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add account.user_id foreign key: orphaned accounts exist';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "threads" t
    LEFT JOIN "user" u ON u."id" = t."user_id"
    WHERE u."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add threads.user_id foreign key: orphaned threads exist';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "access_allowlist"
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';
--> statement-breakpoint
ALTER TABLE "account"
  ALTER COLUMN "access_token_expires_at" TYPE timestamp with time zone USING "access_token_expires_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "refresh_token_expires_at" TYPE timestamp with time zone USING "refresh_token_expires_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';
--> statement-breakpoint
ALTER TABLE "session"
  ALTER COLUMN "expires_at" TYPE timestamp with time zone USING "expires_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';
--> statement-breakpoint
ALTER TABLE "user"
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';
--> statement-breakpoint
ALTER TABLE "verification"
  ALTER COLUMN "expires_at" TYPE timestamp with time zone USING "expires_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';
--> statement-breakpoint
ALTER TABLE "threads"
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC',
  ADD COLUMN "title" text DEFAULT 'Nuevo workspace' NOT NULL;
--> statement-breakpoint
UPDATE "threads" AS t
SET "title" = COALESCE(
  (
    SELECT CASE
      WHEN length(btrim(entry.value->>'message')) > 54
        THEN rtrim(left(btrim(entry.value->>'message'), 54)) || '...'
      ELSE btrim(entry.value->>'message')
    END
    FROM jsonb_array_elements(t."conversation") WITH ORDINALITY AS entry(value, position)
    WHERE entry.value->>'role' = 'user'
      AND btrim(COALESCE(entry.value->>'message', '')) <> ''
    ORDER BY entry.position
    LIMIT 1
  ),
  'Nuevo workspace'
);
--> statement-breakpoint
CREATE TABLE "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chat_id" text NOT NULL,
  "client_id" text NOT NULL,
  "role" text NOT NULL,
  "message" text NOT NULL,
  "diagram" text DEFAULT '' NOT NULL,
  "sent_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "messages_role_check" CHECK ("role" in ('user', 'model'))
);
--> statement-breakpoint
WITH expanded AS (
  SELECT
    t."chat_id",
    t."created_at" AS thread_created_at,
    entry.value,
    entry.position,
    COALESCE(
      NULLIF(entry.value->>'id', ''),
      'legacy-' || entry.position::text
    ) AS base_client_id
  FROM "threads" t
  CROSS JOIN LATERAL jsonb_array_elements(t."conversation")
    WITH ORDINALITY AS entry(value, position)
), ranked AS (
  SELECT
    expanded.*,
    row_number() OVER (
      PARTITION BY "chat_id", base_client_id
      ORDER BY position
    ) AS duplicate_number
  FROM expanded
)
INSERT INTO "messages" (
  "chat_id",
  "client_id",
  "role",
  "message",
  "diagram",
  "sent_at",
  "created_at"
)
SELECT
  "chat_id",
  CASE
    WHEN duplicate_number = 1 THEN base_client_id
    ELSE base_client_id || '-' || duplicate_number::text
  END,
  CASE WHEN value->>'role' = 'user' THEN 'user' ELSE 'model' END,
  COALESCE(value->>'message', ''),
  COALESCE(value->>'diagram', ''),
  CASE
    WHEN COALESCE(value->>'timestamp', '') ~ '^[0-9]+([.][0-9]+)?$'
      AND (value->>'timestamp')::numeric BETWEEN 0 AND 8640000000000000
      THEN to_timestamp((value->>'timestamp')::double precision / 1000)
    ELSE thread_created_at + ((position - 1) * interval '1 millisecond')
  END,
  thread_created_at + ((position - 1) * interval '1 microsecond')
FROM ranked;
--> statement-breakpoint
ALTER TABLE "threads" DROP CONSTRAINT "threads_pkey";
--> statement-breakpoint
ALTER TABLE "threads" DROP COLUMN "id";
--> statement-breakpoint
ALTER TABLE "threads" DROP CONSTRAINT "threads_chat_id_unique";
--> statement-breakpoint
ALTER TABLE "threads" ADD PRIMARY KEY ("chat_id");
--> statement-breakpoint
ALTER TABLE "threads" DROP COLUMN "conversation";
--> statement-breakpoint
DROP TABLE "users";
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_threads_chat_id_fk"
  FOREIGN KEY ("chat_id") REFERENCES "threads"("chat_id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE UNIQUE INDEX "messages_chat_client_unique"
  ON "messages" ("chat_id", "client_id");
--> statement-breakpoint
CREATE INDEX "messages_chat_sent_at_idx"
  ON "messages" ("chat_id", "sent_at", "created_at");
--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" ("user_id");
--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" ("user_id");
--> statement-breakpoint
CREATE INDEX "threads_user_updated_at_idx"
  ON "threads" ("user_id", "updated_at" DESC);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW."updated_at" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER "access_allowlist_set_updated_at"
  BEFORE UPDATE ON "access_allowlist"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER "account_set_updated_at"
  BEFORE UPDATE ON "account"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER "session_set_updated_at"
  BEFORE UPDATE ON "session"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER "user_set_updated_at"
  BEFORE UPDATE ON "user"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER "verification_set_updated_at"
  BEFORE UPDATE ON "verification"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER "threads_set_updated_at"
  BEFORE UPDATE ON "threads"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
