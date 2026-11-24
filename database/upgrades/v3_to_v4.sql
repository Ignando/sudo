-- Sudo database: upgrade an existing V3 database to V4 (keeps existing data)
-- Run this ONCE in pgAdmin on a V3 database. Make a backup first.
--
-- What it does:
--   1. Adds phone and created_at to Users, plus the password hash check
--   2. Adds the Admin and Customer roles and 2 admin accounts
--   3. Creates a Users login for every existing customer
--   4. Points every sales order at a user instead of a customer
--      (old sales with no customer are given to the first admin, since walk-ins are no longer allowed)
--   5. Adds the purchase/sales order links to StockMovement
--   6. Drops the Customer table
--
-- Customers without an email get one like daniel.wilson.1@example.com
-- Demo passwords: admins Admin@123, customers Customer@123 (stored as SHA-256)
--
-- Update the backend at the same time (see the Zed prompt): it still reads the Customer table until then.

BEGIN;

-- 1. Users changes
ALTER TABLE Users
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE Users
    ADD CONSTRAINT chk_users_password_hash
        CHECK (password_hash ~ '^[0-9a-f]{64}$');

-- 2. Roles and admins
INSERT INTO UserRole (role_name, description) VALUES
    ('Admin', 'Store staff with full access to all pages'),
    ('Customer', 'Shopper who can log in and buy products')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO Users (role_id, first_name, last_name, email, phone, password_hash)
SELECT r.role_id, v.first_name, v.last_name, v.email, v.phone,
       encode(sha256(convert_to('Admin@123', 'UTF8')), 'hex')
FROM (VALUES
    ('Anika', 'Botha',  'anika.botha@sudo.co.za',  '021 555 0001'),
    ('Sipho', 'Ndlovu', 'sipho.ndlovu@sudo.co.za', '021 555 0002')
) AS v(first_name, last_name, email, phone)
JOIN UserRole AS r ON r.role_name = 'Admin'
ORDER BY v.email
ON CONFLICT (email) DO NOTHING;

-- 3. A login for every existing customer
CREATE TEMP TABLE customer_login ON COMMIT DROP AS
SELECT c.customer_id,
       c.first_name,
       c.last_name,
       c.phone,
       COALESCE(
           NULLIF(TRIM(c.email), ''),
           regexp_replace(LOWER(c.first_name || '.' || c.last_name), '\s+', '', 'g')
               || '.' || c.customer_id || '@example.com'
       ) AS email
FROM Customer AS c;

INSERT INTO Users (role_id, first_name, last_name, email, phone, password_hash)
SELECT r.role_id, cl.first_name, cl.last_name, cl.email, cl.phone,
       encode(sha256(convert_to('Customer@123', 'UTF8')), 'hex')
FROM customer_login AS cl
JOIN UserRole AS r ON r.role_name = 'Customer'
ORDER BY cl.customer_id
ON CONFLICT (email) DO NOTHING;

-- 4. Sales orders now point at Users
ALTER TABLE SalesOrder ADD COLUMN user_id INTEGER;

UPDATE SalesOrder AS so
SET user_id = u.user_id
FROM customer_login AS cl
JOIN Users AS u ON u.email = cl.email
WHERE cl.customer_id = so.customer_id;

UPDATE SalesOrder
SET user_id = (SELECT user_id FROM Users WHERE email = 'anika.botha@sudo.co.za')
WHERE user_id IS NULL;

ALTER TABLE SalesOrder
    DROP CONSTRAINT fk_salesorder_customer,
    DROP COLUMN customer_id,
    ALTER COLUMN user_id SET NOT NULL,
    ADD CONSTRAINT fk_salesorder_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id);

-- 5. StockMovement links to the order that caused it
ALTER TABLE StockMovement
    ADD COLUMN purchase_order_id INTEGER,
    ADD COLUMN sales_order_id INTEGER,
    ADD CONSTRAINT fk_stockmovement_purchase
        FOREIGN KEY (purchase_order_id)
        REFERENCES PurchaseOrder(purchase_order_id),
    ADD CONSTRAINT fk_stockmovement_sales
        FOREIGN KEY (sales_order_id)
        REFERENCES SalesOrder(sales_order_id),
    ADD CONSTRAINT chk_stockmovement_one_order
        CHECK (purchase_order_id IS NULL OR sales_order_id IS NULL);

-- 6. Customer is no longer needed
DROP TABLE Customer;

COMMIT;
