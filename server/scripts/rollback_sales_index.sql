-- Rollback: Remove partial index on sales(created_at)
-- Purpose: Reverses the optimization for GET /api/dashboard/monthly-sales.

-- Note: DROP INDEX CONCURRENTLY drops the index without locking out concurrent reads/writes on the table.
-- It must be run outside of a transaction block (no BEGIN/COMMIT).

DROP INDEX CONCURRENTLY IF EXISTS idx_sales_partial_completed_created_at;
