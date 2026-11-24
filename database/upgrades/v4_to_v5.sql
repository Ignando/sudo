-- Sudo database: upgrade an existing V4 database to V5 (keeps existing data)
-- Run this ONCE in pgAdmin on a V4 database.
--
-- Adds SalesOrder.expected_delivery_date:
--   * existing orders get order date + 3 days
--   * new orders default to today + 3 days, so the current sales endpoint keeps working unchanged
-- Delivery status ("On the way" / "Delivered") is worked out from this date, it is not stored.

BEGIN;

ALTER TABLE SalesOrder ADD COLUMN expected_delivery_date DATE;

UPDATE SalesOrder
SET expected_delivery_date = order_date::date + 3;

ALTER TABLE SalesOrder
    ALTER COLUMN expected_delivery_date SET NOT NULL,
    ALTER COLUMN expected_delivery_date SET DEFAULT (CURRENT_DATE + 3),
    ADD CONSTRAINT chk_salesorder_delivery_date
        CHECK (expected_delivery_date >= order_date::date);

COMMIT;
