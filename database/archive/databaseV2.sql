
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
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES UserRole(role_id)
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

CREATE TABLE Customer (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20)
);

CREATE TABLE Supplier (
    supplier_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20),
    address TEXT
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

CREATE TABLE StockMovement (
    movement_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    movement_type VARCHAR(30) NOT NULL
        CHECK (movement_type IN ('Purchase', 'Sale', 'Adjustment')),
    quantity INTEGER NOT NULL,

    movement_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,

    CONSTRAINT fk_stockmovement_product
        FOREIGN KEY (product_id)
        REFERENCES Product(product_id),

    CONSTRAINT chk_stockmovement_quantity
        CHECK (
            (movement_type = 'Purchase' AND quantity > 0)
            OR
            (movement_type = 'Sale' AND quantity < 0)
            OR
            (movement_type = 'Adjustment' AND quantity <> 0)
        )
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
    customer_id INTEGER,
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    order_status VARCHAR(30) NOT NULL DEFAULT 'Draft'
        CHECK (order_status IN ('Draft', 'Completed', 'Voided')),

    CONSTRAINT fk_salesorder_customer
        FOREIGN KEY (customer_id)
        REFERENCES Customer(customer_id)
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

COMMIT;
