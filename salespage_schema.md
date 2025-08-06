| table_name              | column_name             | data_type                   | is_nullable | ordinal_position |
| ----------------------- | ----------------------- | --------------------------- | ----------- | ---------------- |
| clients                 | id                      | uuid                        | NO          | 1                |
| clients                 | name                    | text                        | NO          | 2                |
| clients                 | contact_email           | text                        | YES         | 3                |
| clients                 | phone                   | text                        | YES         | 4                |
| clients                 | notes                   | text                        | YES         | 5                |
| clients                 | created_at              | timestamp with time zone    | NO          | 6                |
| clients                 | updated_at              | timestamp with time zone    | NO          | 7                |
| clients                 | address                 | text                        | YES         | 8                |
| clients                 | contact_person          | text                        | YES         | 9                |
| clients                 | department_count        | integer                     | YES         | 10               |
| clients                 | printer_count           | integer                     | YES         | 11               |
| clients                 | client_code             | text                        | YES         | 12               |
| clients                 | status                  | text                        | YES         | 13               |
| clients                 | timezone                | text                        | YES         | 14               |
| clients                 | archived_at             | timestamp with time zone    | YES         | 15               |
| clients                 | tags                    | ARRAY                       | YES         | 16               |
| clients                 | location_count          | integer                     | YES         | 17               |
| deliveries              | id                      | uuid                        | NO          | 1                |
| deliveries              | purchase_order_id       | uuid                        | YES         | 2                |
| deliveries              | delivery_date           | date                        | NO          | 3                |
| deliveries              | delivery_receipt_number | text                        | YES         | 4                |
| deliveries              | notes                   | text                        | YES         | 5                |
| deliveries              | created_at              | timestamp with time zone    | YES         | 6                |
| delivery_items          | id                      | uuid                        | NO          | 1                |
| delivery_items          | delivery_id             | uuid                        | NO          | 2                |
| delivery_items          | product_id              | uuid                        | YES         | 3                |
| delivery_items          | quantity_delivered      | integer                     | NO          | 4                |
| delivery_items          | created_at              | timestamp with time zone    | YES         | 5                |
| product_clients         | id                      | uuid                        | NO          | 1                |
| product_clients         | product_id              | uuid                        | NO          | 2                |
| product_clients         | client_id               | uuid                        | NO          | 3                |
| product_clients         | quoted_price            | numeric                     | NO          | 4                |
| product_clients         | margin_percentage       | numeric                     | YES         | 5                |
| product_clients         | created_at              | timestamp with time zone    | NO          | 6                |
| product_clients         | updated_at              | timestamp with time zone    | NO          | 7                |
| products                | id                      | uuid                        | NO          | 1                |
| products                | name                    | text                        | NO          | 2                |
| products                | sku                     | text                        | NO          | 3                |
| products                | category                | text                        | NO          | 4                |
| products                | description             | text                        | YES         | 5                |
| products                | created_at              | timestamp with time zone    | NO          | 6                |
| products                | updated_at              | timestamp with time zone    | NO          | 7                |
| products                | color                   | text                        | YES         | 8                |
| products                | alias                   | text                        | YES         | 9                |
| products                | aliases                 | text                        | YES         | 10               |
| purchase_order_items    | id                      | uuid                        | NO          | 1                |
| purchase_order_items    | purchase_order_id       | uuid                        | NO          | 2                |
| purchase_order_items    | product_id              | uuid                        | YES         | 3                |
| purchase_order_items    | model                   | text                        | YES         | 4                |
| purchase_order_items    | quantity                | integer                     | NO          | 5                |
| purchase_order_items    | unit_price              | numeric                     | NO          | 6                |
| purchase_order_items    | total_price             | numeric                     | YES         | 7                |
| purchase_order_items    | created_at              | timestamp with time zone    | YES         | 8                |
| purchase_order_payments | id                      | uuid                        | NO          | 1                |
| purchase_order_payments | payment_reference       | character varying           | YES         | 2                |
| purchase_order_payments | payment_date            | timestamp without time zone | NO          | 3                |
| purchase_order_payments | total_amount            | numeric                     | NO          | 4                |
| purchase_order_payments | method                  | character varying           | YES         | 5                |
| purchase_order_payments | notes                   | jsonb                       | YES         | 6                |
| purchase_order_payments | created_at              | timestamp without time zone | YES         | 7                |
| purchase_order_payments | updated_at              | timestamp without time zone | YES         | 8                |
| purchase_orders         | id                      | uuid                        | NO          | 1                |
| purchase_orders         | supplier_client_id      | uuid                        | YES         | 2                |
| purchase_orders         | supplier_name           | text                        | YES         | 3                |
| purchase_orders         | status                  | text                        | YES         | 4                |
| purchase_orders         | payment_status          | text                        | YES         | 5                |
| purchase_orders         | notes                   | text                        | YES         | 6                |
| purchase_orders         | created_at              | timestamp with time zone    | YES         | 7                |
| purchase_orders         | updated_at              | timestamp with time zone    | YES         | 8                |
| purchase_orders         | purchase_order_number   | character varying           | YES         | 9                |
| purchase_orders         | client_po               | character varying           | YES         | 10               |
| purchase_orders         | sale_invoice_number     | text                        | YES         | 11               |
