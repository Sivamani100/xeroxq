-- XeroxQ Architecture Enhancement: Performance Indexes
-- Purpose: Speed up global billing stats and aggregate queries for the CEO Dashboard.
-- Author: System Architect

-- Primary index for shop lookups by ID (usually default, but making explicit for scale)
CREATE INDEX IF NOT EXISTS idx_jobs_shop_id ON jobs(shop_id);

-- index for status filtering (used in pending count)
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- index for created_at sorting in the CEO dashboard
CREATE INDEX IF NOT EXISTS idx_shops_created_at ON shops(created_at DESC);

-- Ensure slug is indexed for fast public routing
CREATE INDEX IF NOT EXISTS idx_shops_slug ON shops(slug);

COMMENT ON INDEX idx_jobs_shop_id IS 'Speeds up per-shop job aggregation for platform stats.';
COMMENT ON INDEX idx_jobs_status IS 'Optimizes pending queue counts across all shops.';
