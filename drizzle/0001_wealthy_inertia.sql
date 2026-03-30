ALTER TABLE "threads" ADD COLUMN "is_canvas_shared" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "share_token" text;--> statement-breakpoint
CREATE UNIQUE INDEX "threads_share_token_unique" ON "threads" USING btree ("share_token");