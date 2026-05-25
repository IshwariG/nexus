-- ==========================================
-- 1. Create CP_Partners table
-- ==========================================
CREATE TABLE IF NOT EXISTS "CP_Partners" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL, -- Logical link to Users.username
    firm_name VARCHAR(255) NOT NULL,
    rera_number VARCHAR(255) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 2.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable Row Level Security (RLS) so the Next.js client can select/insert directly
ALTER TABLE "CP_Partners" DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. Create Commissions table
-- ==========================================
CREATE TABLE IF NOT EXISTS "Commissions" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cp_id UUID REFERENCES "CP_Partners"(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    unit_id VARCHAR(255), -- E.g. "101", "205"
    amount VARCHAR(255) NOT NULL, -- e.g., "₹ 28.50 L"
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, PAID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE "Commissions" DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. Create Payouts table
-- ==========================================
CREATE TABLE IF NOT EXISTS "Payouts" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_id UUID REFERENCES "Commissions"(id) ON DELETE CASCADE,
    cp_id UUID REFERENCES "CP_Partners"(id) ON DELETE CASCADE,
    amount VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'PROCESSING', -- PROCESSING, PAID
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE "Payouts" DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. Initial Seed Data
-- ==========================================

-- Insert a test Channel Partner login record into Users (in case it wasn't seeded yet)
-- Note: 'ON CONFLICT (username) DO NOTHING' is standard. If username is primary key:
INSERT INTO "Users" (username, password, role)
VALUES ('cp101', 'password123', 'ChannelPartner')
ON CONFLICT DO NOTHING;

-- Seed the corresponding CP Partner profile
INSERT INTO "CP_Partners" (username, firm_name, rera_number, commission_rate)
VALUES ('cp101', 'Apex Luxury Realty', 'RERA-MUM-98765-CP', 2.50)
ON CONFLICT (username) DO NOTHING;

-- Seed some Referred Leads in the Inquiries table linked to CP (using CP_Referral source)
INSERT INTO "Inquiries" (name, email, phone, message, source, status)
VALUES 
('Devendra Singhania', 'devendra@singhania.co', '9892011223', 'Interested in a 4BHK Penthouse. Referred by Apex Luxury Realty.', 'CP_Referral|cp101', 'QUALIFIED|SR-9999'),
('Reema Sen', 'reema.sen@gmail.com', '9819922334', 'Looking for site visit of Vanya Tower A. Referred by Apex.', 'CP_Referral|cp101', 'NEW|SR-9999');

-- Seed dummy Commissions
-- First fetch the CP_Partner ID for cp101 and insert commissions
-- Using subqueries to insert matching commissions:
INSERT INTO "Commissions" (cp_id, client_name, unit_id, amount, status)
SELECT id, 'Devendra Singhania', '101', '₹ 28.50 L', 'APPROVED'
FROM "CP_Partners"
WHERE username = 'cp101'
LIMIT 1;

INSERT INTO "Commissions" (cp_id, client_name, unit_id, amount, status)
SELECT id, 'Harish Goenka', '303', '₹ 15.20 L', 'PAID'
FROM "CP_Partners"
WHERE username = 'cp101'
LIMIT 1;

-- Seed dummy Payouts for the PAID commission
INSERT INTO "Payouts" (commission_id, cp_id, amount, status, paid_at)
SELECT c.id, cp.id, '₹ 15.20 L', 'PAID', timezone('utc'::text, now() - interval '5 days')
FROM "Commissions" c
JOIN "CP_Partners" cp ON c.cp_id = cp.id
WHERE cp.username = 'cp101' AND c.client_name = 'Harish Goenka'
LIMIT 1;
