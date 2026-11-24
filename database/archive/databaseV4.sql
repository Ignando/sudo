-- Sudo database V4
-- Changes from V3:
--   * Users and UserRole are now in use
--   * Two roles: Admin (full access) and Customer (logs in to buy)
--   * Customer table removed: every buyer is a Users row (no walk-in sales)
--   * Users gets phone and created_at
--   * SalesOrder.customer_id replaced by SalesOrder.user_id (NOT NULL, admins can buy too)
--   * StockMovement gets purchase_order_id and sales_order_id (optional links to the order that caused it)
--   * password_hash stores a SHA-256 hash (64 hex characters)
--       simple baseline only: no salt yet, swap for bcrypt later
--   * Mock data: 2 admins + 9 customers
--
-- Fresh install script. To upgrade an existing V3 database and keep its data,
-- run databaseV4_upgrade_from_v3.sql instead.

BEGIN;


CREATE TABLE UserRole (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES UserRole(role_id),

    CONSTRAINT chk_users_password_hash
        CHECK (password_hash ~ '^[0-9a-f]{64}$')
);


CREATE TABLE Category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE Product (
    product_id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(150) NOT NULL,
    brand VARCHAR(100),
    description TEXT,
    selling_price NUMERIC(10,2) NOT NULL
        CHECK (selling_price >= 0),

    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id)
        REFERENCES Category(category_id)
);

CREATE TABLE Supplier (
    supplier_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20),
    address TEXT
);

CREATE TABLE SupplierProduct (
    supplier_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    unit_cost NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0),
    lead_time_days INTEGER NOT NULL DEFAULT 3 CHECK (lead_time_days >= 0),
    CONSTRAINT pk_supplierproduct PRIMARY KEY (supplier_id, product_id),
    CONSTRAINT fk_supplierproduct_supplier FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id),
    CONSTRAINT fk_supplierproduct_product FOREIGN KEY (product_id) REFERENCES Product(product_id)
);

CREATE TABLE Inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL UNIQUE,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0
        CHECK (quantity_on_hand >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 10
        CHECK (reorder_level >= 0),
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id)
        REFERENCES Product(product_id)
);

CREATE TABLE PurchaseOrder (
    purchase_order_id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft'
        CHECK (status IN ('Draft', 'Submitted', 'Received', 'Cancelled')),

    CONSTRAINT fk_purchaseorder_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES Supplier(supplier_id),

    CONSTRAINT chk_purchase_expected_date
        CHECK (expected_date IS NULL OR expected_date >= order_date)
);

CREATE TABLE PurchaseOrderItem (
    purchase_order_item_id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL
        CHECK (quantity > 0),
    unit_cost NUMERIC(10,2) NOT NULL
        CHECK (unit_cost >= 0),

    CONSTRAINT fk_purchaseitem_order
        FOREIGN KEY (purchase_order_id)
        REFERENCES PurchaseOrder(purchase_order_id),

    CONSTRAINT fk_purchaseitem_product
        FOREIGN KEY (product_id)
        REFERENCES Product(product_id),

    CONSTRAINT uq_purchaseitem_product
        UNIQUE (purchase_order_id, product_id)
);

CREATE TABLE SalesOrder (
    sales_order_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    order_status VARCHAR(30) NOT NULL DEFAULT 'Draft'
        CHECK (order_status IN ('Draft', 'Completed', 'Voided')),

    CONSTRAINT fk_salesorder_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
);

CREATE TABLE SalesOrderItem (
    sales_order_item_id SERIAL PRIMARY KEY,
    sales_order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL
        CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL
        CHECK (unit_price >= 0),

    CONSTRAINT fk_salesitem_order
        FOREIGN KEY (sales_order_id)
        REFERENCES SalesOrder(sales_order_id),

    CONSTRAINT fk_salesitem_product
        FOREIGN KEY (product_id)
        REFERENCES Product(product_id)
);

-- Created last because it references both order tables
CREATE TABLE StockMovement (
    movement_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    movement_type VARCHAR(30) NOT NULL
        CHECK (movement_type IN ('Purchase', 'Sale', 'Adjustment')),
    quantity INTEGER NOT NULL,

    movement_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    purchase_order_id INTEGER,
    sales_order_id INTEGER,

    CONSTRAINT fk_stockmovement_product
        FOREIGN KEY (product_id)
        REFERENCES Product(product_id),

    CONSTRAINT fk_stockmovement_purchase
        FOREIGN KEY (purchase_order_id)
        REFERENCES PurchaseOrder(purchase_order_id),

    CONSTRAINT fk_stockmovement_sales
        FOREIGN KEY (sales_order_id)
        REFERENCES SalesOrder(sales_order_id),

    CONSTRAINT chk_stockmovement_quantity
        CHECK (
            (movement_type = 'Purchase' AND quantity > 0)
            OR
            (movement_type = 'Sale' AND quantity < 0)
            OR
            (movement_type = 'Adjustment' AND quantity <> 0)
        ),

    -- a movement comes from a purchase order, a sales order, or neither (adjustment), never both
    CONSTRAINT chk_stockmovement_one_order
        CHECK (purchase_order_id IS NULL OR sales_order_id IS NULL)
);


-- ------------------------------------------------------------
-- Mock data: roles and users
-- Demo passwords:
--   Admins:    Admin@123
--   Customers: Customer@123
-- sha256() is built into PostgreSQL 11+, the backend uses Node's built-in crypto
-- ------------------------------------------------------------

INSERT INTO UserRole (role_name, description) VALUES
    ('Admin', 'Store staff with full access to all pages'),
    ('Customer', 'Shopper who can log in and buy products');

INSERT INTO Users (role_id, first_name, last_name, email, phone, password_hash)
SELECT r.role_id, v.first_name, v.last_name, v.email, v.phone,
       encode(sha256(convert_to(v.password, 'UTF8')), 'hex')
FROM (VALUES
    ('Admin',    'Anika',   'Botha',    'anika.botha@sudo.co.za',     '021 555 0001', 'Admin@123'),
    ('Admin',    'Sipho',   'Ndlovu',   'sipho.ndlovu@sudo.co.za',    '021 555 0002', 'Admin@123'),
    ('Customer', 'Daniel',  'Wilson',   'daniel.wilson@example.com',  '082 555 0101', 'Customer@123'),
    ('Customer', 'David',   'Miller',   'david.miller@example.com',   '082 555 0102', 'Customer@123'),
    ('Customer', 'Emily',   'Jones',    'emily.jones@example.com',    '082 555 0103', 'Customer@123'),
    ('Customer', 'Emma',    'Davis',    'emma.davis@example.com',     '082 555 0104', 'Customer@123'),
    ('Customer', 'James',   'Smith',    'james.smith@example.com',    '082 555 0105', 'Customer@123'),
    ('Customer', 'Michael', 'Brown',    'michael.brown@example.com',  '082 555 0106', 'Customer@123'),
    ('Customer', 'Olivia',  'Taylor',   'olivia.taylor@example.com',  '082 555 0107', 'Customer@123'),
    ('Customer', 'Sarah',   'Williams', 'sarah.williams@example.com', '082 555 0108', 'Customer@123'),
    ('Customer', 'Thandi',  'Mokoena',  'thandi.mokoena@example.com', '082 555 0109', 'Customer@123')
) AS v(role_name, first_name, last_name, email, phone, password)
JOIN UserRole AS r ON r.role_name = v.role_name
ORDER BY r.role_id, v.email;

COMMIT;
