-- ==============================================================================
-- RCB AUCTION PREDICTOR 2027: PostgreSQL & Supabase Database Migration
-- Version: 001_initial_schema.sql
-- ==============================================================================

-- 1. Contest Settings Table
CREATE TABLE IF NOT EXISTS contest_settings (
    id SERIAL PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'LOCKED', 'RESULTS_LIVE')),
    max_purse_lakh INTEGER NOT NULL DEFAULT 115,
    min_picks INTEGER NOT NULL DEFAULT 2,
    max_picks INTEGER NOT NULL DEFAULT 5,
    max_overseas INTEGER NOT NULL DEFAULT 2,
    deadline TIMESTAMPTZ DEFAULT NULL,
    results_published_at TIMESTAMPTZ DEFAULT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default contest settings if not present
INSERT INTO contest_settings (id, status, max_purse_lakh, min_picks, max_picks, max_overseas)
VALUES (1, 'OPEN', 115, 2, 5, 2)
ON CONFLICT (id) DO NOTHING;

-- 2. Players Table (All 146 Players from Official WPL 2027 Auction PDF)
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,
    list_sr_no INTEGER NOT NULL UNIQUE,
    set_no INTEGER NOT NULL,
    set_code VARCHAR(10) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_overseas BOOLEAN NOT NULL DEFAULT FALSE,
    state_association VARCHAR(100) DEFAULT NULL,
    dob VARCHAR(20) NOT NULL,
    age INTEGER NOT NULL,
    specialism VARCHAR(50) NOT NULL CHECK (specialism IN ('BATTER', 'ALL-ROUNDER', 'WICKETKEEPER', 'BOWLER')),
    batting_hand VARCHAR(10) DEFAULT NULL CHECK (batting_hand IN ('RHB', 'LHB', NULL)),
    bowling_style VARCHAR(100) DEFAULT NULL,
    previous_wpl_team VARCHAR(50) DEFAULT NULL,
    previous_wpl_matches INTEGER DEFAULT NULL,
    classification VARCHAR(20) NOT NULL CHECK (classification IN ('Capped', 'Uncapped', 'Associate')),
    base_price_lakh INTEGER NOT NULL CHECK (base_price_lakh IN (10, 20, 30, 40, 50)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_country ON players(country);
CREATE INDEX IF NOT EXISTS idx_players_is_overseas ON players(is_overseas);
CREATE INDEX IF NOT EXISTS idx_players_specialism ON players(specialism);
CREATE INDEX IF NOT EXISTS idx_players_base_price ON players(base_price_lakh);

-- 3. Participants Table (Phone + Display Name, No OTP)
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_normalized VARCHAR(15) NOT NULL UNIQUE, -- Plausible 10-digit Indian mobile number
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_phone ON participants(phone_normalized);

-- 4. Prediction Entries Table
CREATE TABLE IF NOT EXISTS entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL UNIQUE REFERENCES participants(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    total_spend_lakh INTEGER NOT NULL CHECK (total_spend_lakh <= 115),
    pick_count INTEGER NOT NULL CHECK (pick_count >= 2 AND pick_count <= 5),
    overseas_count INTEGER NOT NULL CHECK (overseas_count <= 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entries_participant ON entries(participant_id);

-- 5. Entry Picks Table
CREATE TABLE IF NOT EXISTS entry_picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
    predicted_price_lakh INTEGER NOT NULL CHECK (predicted_price_lakh >= 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_player_per_entry UNIQUE (entry_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_entry_picks_entry ON entry_picks(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_picks_player ON entry_picks(player_id);

-- 6. Official Auction Results Table (Recorded only by Admin)
CREATE TABLE IF NOT EXISTS auction_results (
    player_id INTEGER PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    purchased_by_rcb BOOLEAN NOT NULL DEFAULT FALSE,
    actual_price_lakh INTEGER DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_purchase_price CHECK (
        (purchased_by_rcb = FALSE AND actual_price_lakh IS NULL) OR
        (purchased_by_rcb = TRUE AND actual_price_lakh >= 10)
    )
);

-- 7. Admin Audit Log Table
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON admin_audit_log(created_at DESC);

-- 8. Row-Level Security (RLS) Policies
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_settings ENABLE ROW LEVEL SECURITY;

-- Public can read players and contest settings
CREATE POLICY public_read_players ON players FOR SELECT USING (true);
CREATE POLICY public_read_settings ON contest_settings FOR SELECT USING (true);

-- Public view for Leaderboard: NEVER exposes phone numbers
CREATE OR REPLACE VIEW public_leaderboard AS
SELECT 
    e.id AS entry_id,
    p.id AS participant_id,
    p.display_name,
    e.created_at AS submitted_at,
    e.total_spend_lakh,
    e.pick_count,
    e.overseas_count
FROM entries e
JOIN participants p ON e.participant_id = p.id;
