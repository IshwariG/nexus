-- =======================================================
-- ADD PHONE COLUMN TO USERS TABLE FOR OTP PASSWORD RESET
-- =======================================================

-- 1. Add the phone column to the Users table if it doesn't already exist
ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS phone VARCHAR(255);

-- 2. Make sure the phone column is nullable or set defaults if needed
-- (it is nullable by default in Postgres when added without NOT NULL).

-- 3. (Optional) You can update existing users with their phone numbers:
-- UPDATE "Users" SET phone = '9876543210' WHERE username = 'ADM-1234';
-- UPDATE "Users" SET phone = '9988776655' WHERE username = 'SR-9999';
