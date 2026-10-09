-- Migration: Add partial index on sales(created_at) for completed sales
-- Purpose: Optimizes GET /api/dashboard/monthly-sales by scanning only completed sales within a date range.

-- Note: CREATE INDEX CONCURRENTLY builds the index without locking out concurrent inserts, updates, or deletes on the table.
-- It must be run outside of a transaction block (no BEGIN/COMMIT).

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_partial_completed_created_at 
ON sales (created_at) 
WHERE status = 'completed';
