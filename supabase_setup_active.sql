-- Run this SQL in your Supabase SQL Editor to add the is_active column for soft deletes:

ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;
ALTER TABLE "CP_Partners" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;
