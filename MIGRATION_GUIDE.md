# Customer Database Migration Guide

This guide provides step-by-step instructions for running the customer database migrations.

## Prerequisites

1. **PostgreSQL Database** with the following extensions:
   - `uuid-ossp` (for UUID generation)
   - `btree_gin` (for JSONB indexing, optional but recommended)

2. **Database User Permissions**:
   - CREATE TABLE
   - CREATE INDEX
   - CREATE FUNCTION
   - CREATE TRIGGER
   - INSERT

## Migration Files

The customer schema is implemented across multiple migration files:

1. **V1.5__ensure_uuid_extension.sql** - Ensures UUID extension is available
2. **V2__create_customer_schema.sql** - Creates all customer-related tables and sample data

## Migration Order

Migrations must be run in the following order:

### Step 1: Ensure UUID Extension
```sql
-- Run this first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Step 2: Run Customer Schema Migration
```sql
-- Run the complete V2 migration
-- This will create:
-- - customers table
-- - customer_contacts table  
-- - customer_documents table
-- - customer_notes table
-- - customer_audit_log table
-- - All indexes, triggers, and functions
-- - Sample data for testing
```

## Running Migrations

### Option 1: Using Flyway (Recommended)
If you're using Flyway for database migrations:

1. Place the migration files in `BACKEND/src/main/resources/db/migration/`
2. Run your application or use Flyway command line:
   ```bash
   ./flyway migrate
   ```

### Option 2: Manual SQL Execution
Execute the SQL files directly in your PostgreSQL client:

```bash
# Connect to your database
psql -h hostname -U username -d database_name

# Run migrations in order
\i BACKEND/src/main/resources/db/migration/V1.5__ensure_uuid_extension.sql
\i BACKEND/src/main/resources/db/migration/V2__create_customer_schema.sql
```

### Option 3: Using psql Command Line
```bash
# Run individual files
psql -h hostname -U username -d database_name -f V1.5__ensure_uuid_extension.sql
psql -h hostname -U username -d database_name -f V2__create_customer_schema.sql
```

## Verification

After running the migrations, verify the schema was created correctly:

### Check Tables
```sql
-- Verify all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'customers', 
    'customer_contacts', 
    'customer_documents', 
    'customer_notes', 
    'customer_audit_log'
);
```

### Check Sample Data
```sql
-- Verify sample customer was created
SELECT customer_code, name, company_name, status 
FROM customers 
WHERE customer_code = 'CUST-001';

-- Verify sample contacts were created
SELECT name, email, designation, is_primary 
FROM customer_contacts 
WHERE customer_id = (SELECT id FROM customers WHERE customer_code = 'CUST-001');

-- Verify sample documents were created
SELECT document_type, document_name, is_active 
FROM customer_documents 
WHERE customer_id = (SELECT id FROM customers WHERE customer_code = 'CUST-001');

-- Verify sample notes were created
SELECT note_type, title, content 
FROM customer_notes 
WHERE customer_id = (SELECT id FROM customers WHERE customer_code = 'CUST-001');
```

### Check Indexes
```sql
-- Verify indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN (
    'customers', 
    'customer_contacts', 
    'customer_documents', 
    'customer_notes', 
    'customer_audit_log'
);
```

### Check Functions and Triggers
```sql
-- Verify functions were created
SELECT proname FROM pg_proc WHERE proname LIKE '%update%at%';

-- Verify triggers were created
SELECT tgname, relname 
FROM pg_trigger t 
JOIN pg_class c ON t.tgrelid = c.oid 
WHERE t.tgname LIKE '%update%at%';
```

## Troubleshooting

### Common Issues

1. **UUID Extension Not Found**
   ```
   ERROR:  function gen_random_uuid() does not exist
   ```
   **Solution**: Run V1.5 migration first or manually create the extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

2. **Permission Denied**
   ```
   ERROR:  permission denied for schema information_schema
   ```
   **Solution**: Ensure your database user has the necessary permissions to create tables, indexes, and functions.

3. **Duplicate Key Violation**
   ```
   ERROR:  duplicate key value violates unique constraint
   ```
   **Solution**: This usually means the migration was run before. Check if tables already exist and drop them if needed (be careful in production).

4. **Function Already Exists**
   ```
   ERROR:  function update_updated_at_column() already exists
   ```
   **Solution**: The function was created in a previous migration. Use `CREATE OR REPLACE FUNCTION` instead.

### Resetting for Testing

To reset the customer schema for testing:

```sql
-- Drop all customer-related tables (CASCADE will handle foreign keys)
DROP TABLE IF EXISTS customer_audit_log CASCADE;
DROP TABLE IF EXISTS customer_documents CASCADE;
DROP TABLE IF EXISTS customer_notes CASCADE;
DROP TABLE IF EXISTS customer_contacts CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop triggers (they will be dropped with tables, but this is explicit)
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_customer_contacts_updated_at ON customer_contacts;
```

## Performance Considerations

1. **Index Usage**: The migration creates strategic indexes for common query patterns
2. **JSONB Storage**: Audit logs use JSONB for flexible change tracking
3. **UUID Primary Keys**: Use UUIDs for distributed systems and better security
4. **Cascade Deletes**: Foreign keys use CASCADE for automatic cleanup

## Next Steps

After successful migration:

1. **Update Application Code**: Ensure your application uses the new schema
2. **Test CRUD Operations**: Verify create, read, update, delete operations work
3. **Test Constraints**: Verify business rules and validation work correctly
4. **Test Performance**: Run queries to ensure indexes are being used
5. **Backup**: Create a backup of your database with the new schema

## Support

If you encounter issues:

1. Check the PostgreSQL logs for detailed error messages
2. Verify your database user has sufficient permissions
3. Ensure PostgreSQL version supports all features used (9.4+ recommended)
4. Check that required extensions are installed and enabled