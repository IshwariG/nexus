-- =======================================================
-- Database setup for new CRM, Telephony & Grievance tables
-- =======================================================

-- 1. Create Opportunities Table
CREATE TABLE IF NOT EXISTS "Opportunities" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID NOT NULL,
    walk_in_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    tag_start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    tag_end_date TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '30 days') NOT NULL,
    cp_username VARCHAR(255),
    status VARCHAR(50) DEFAULT 'QUALIFIED', -- QUALIFIED, NEGOTIATION, BOOKED, LOST
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE "Opportunities" DISABLE ROW LEVEL SECURITY;

-- 2. Create CallLogs Table
CREATE TABLE IF NOT EXISTS "CallLogs" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID,
    salesman_id VARCHAR(255) NOT NULL,
    duration INTEGER DEFAULT 0, -- in seconds
    recording_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE "CallLogs" DISABLE ROW LEVEL SECURITY;

-- 3. Create SourcingMetrics Table
CREATE TABLE IF NOT EXISTS "SourcingMetrics" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cp_username VARCHAR(255) NOT NULL,
    zone VARCHAR(50) DEFAULT 'East', -- East or West
    walk_in_target INTEGER DEFAULT 0,
    walk_in_actual INTEGER DEFAULT 0,
    week_start DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE "SourcingMetrics" DISABLE ROW LEVEL SECURITY;

-- 4. Create Referrals Table
CREATE TABLE IF NOT EXISTS "Referrals" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_username VARCHAR(255) NOT NULL,
    friend_name VARCHAR(255) NOT NULL,
    friend_phone VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'REFERRED', -- REFERRED, WALKED_IN, BOOKED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE "Referrals" DISABLE ROW LEVEL SECURITY;

-- 5. Create SupportTickets Table (if not exists)
CREATE TABLE IF NOT EXISTS "SupportTickets" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL,
    category VARCHAR(255) DEFAULT 'Other', -- Leakage, Bathroom, Possession, Payments, Construction
    description TEXT,
    status VARCHAR(50) DEFAULT 'Open', -- Open, Closed, Escalated
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    escalated_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "SupportTickets" DISABLE ROW LEVEL SECURITY;

-- Seed some test data for SourcingMetrics and Zones
INSERT INTO "SourcingMetrics" (cp_username, zone, walk_in_target, walk_in_actual)
VALUES 
('cp101', 'East', 25, 12)
ON CONFLICT DO NOTHING;

-- Seed a test referral
INSERT INTO "Referrals" (referrer_username, friend_name, friend_phone, status)
VALUES 
('buyer101', 'Vikram Aditya', '9822334455', 'REFERRED')
ON CONFLICT DO NOTHING;
