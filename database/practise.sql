CREATE TABLE PracticeProducts (
    ProductID INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ProductName VARCHAR(100) NOT NULL,
    Price NUMERIC(10,2) NOT NULL
);

INSERT INTO PracticeProducts (ProductName, Price)
VALUES
    ('Gaming Mouse', 499.99),
    ('Mechanical Keyboard', 899.99),
    ('USB Headset', 349.99);

SELECT * FROM PracticeProducts;