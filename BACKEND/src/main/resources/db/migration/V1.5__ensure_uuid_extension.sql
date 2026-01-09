-- Ensure UUID extension is available for V2 migration
-- This should be run before V2__create_customer_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";