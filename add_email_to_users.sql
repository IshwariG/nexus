-- =======================================================
-- ADD EMAIL COLUMN TO USERS TABLE FOR GENERAL USER email
-- =======================================================

-- Add the email column to the Users table if it doesn't already exist
ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);
