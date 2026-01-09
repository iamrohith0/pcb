# Customer Database Schema Documentation

This document describes the customer database schema created for the PCBXpress ERP system.

## Overview

The customer schema consists of several related tables that store comprehensive customer information including:

- **Core Customer Information** - Basic customer details, contact information, and business data
- **Customer Contacts** - Multiple contact persons for a single customer
- **Customer Documents** - Important documents like NDA, certificates, etc.
- **Customer Notes** - Internal notes and history for customer management
- **Customer Audit Log** - Change tracking and audit trail for compliance

## Database Tables

### 1. customers

The main table storing core customer information.

**Fields:**
- `id` (UUID) - Primary key, auto-generated
- `customer_code` (VARCHAR(50)) - Unique customer identifier
- `name` (VARCHAR(100)) - Customer name (required)
- `company_name` (VARCHAR(200)) - Company name
- `email` (VARCHAR(150)) - Email address
- `phone` (VARCHAR(20)) - Phone number
- `website` (VARCHAR(200)) - Company website
- `gstin` (VARCHAR(20)) - GST identification number
- `pan` (VARCHAR(15)) - Permanent account number
- `status` (VARCHAR(20)) - Customer status (ACTIVE/INACTIVE/BLOCKED)
- `notes` (TEXT) - Internal notes

**Address Fields:**
- `billing_name` (VARCHAR(150)) - Billing contact name
- `billing_address_line1` (VARCHAR(200)) - Billing address line 1
- `billing_address_line2` (VARCHAR(200)) - Billing address line 2
- `billing_city` (VARCHAR(100)) - Billing city
- `billing_state` (VARCHAR(100)) - Billing state
- `billing_pincode` (VARCHAR(10)) - Billing pincode
- `billing_country` (VARCHAR(50)) - Billing country (default: India)
- `billing_gstin` (VARCHAR(20)) - Billing GSTIN
- `shipping_name` (VARCHAR(150)) - Shipping contact name
- `shipping_address_line1` (VARCHAR(200)) - Shipping address line 1
- `shipping_address_line2` (VARCHAR(200)) - Shipping address line 2
- `shipping_city` (VARCHAR(100)) - Shipping city
- `shipping_state` (VARCHAR(100)) - Shipping state
- `shipping_pincode` (VARCHAR(10)) - Shipping pincode
- `shipping_country` (VARCHAR(50)) - Shipping country (default: India)
- `shipping_gstin` (VARCHAR(20)) - Shipping GSTIN

**Commercial Fields:**
- `credit_limit` (DECIMAL(15,2)) - Credit limit amount
- `payment_terms_days` (INTEGER) - Payment terms in days
- `currency` (VARCHAR(5)) - Currency code (default: INR)

**Compliance Fields:**
- `compliance_nda_required` (BOOLEAN) - NDA required flag
- `compliance_ip_sensitive` (BOOLEAN) - IP sensitive flag
- `compliance_export_restricted` (BOOLEAN) - Export restricted flag

**PCB Preferences:**
- `preferred_finish` (VARCHAR(50)) - Surface finish preference
- `preferred_copper_oz` (VARCHAR(20)) - Copper thickness preference
- `preferred_solder_mask` (VARCHAR(50)) - Solder mask color preference
- `preferred_legend` (VARCHAR(50)) - Legend color preference
- `preferred_packaging` (VARCHAR(100)) - Packaging preference
- `preferred_courier` (VARCHAR(100)) - Preferred courier service

**Audit Fields:**
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

**Constraints:**
- Customer code must be unique
- Status must be one of: ACTIVE, INACTIVE, BLOCKED
- Credit limit must be positive or null
- Payment terms must be positive or null
- PINCODE format validation (6 digits)
- GSTIN format validation (Indian GST format)
- PAN format validation (Indian PAN format)

**Indexes:**
- `idx_customers_code` - Customer code
- `idx_customers_email` - Email address
- `idx_customers_status` - Customer status
- `idx_customers_company_name` - Company name
- `idx_customers_gstin` - GSTIN
- `idx_customers_pan` - PAN
- `idx_customers_billing_city` - Billing city
- `idx_customers_shipping_city` - Shipping city
- `idx_customers_created_at` - Creation date
- `idx_customers_updated_at` - Update date

### 2. customer_contacts

Stores multiple contact persons for each customer.

**Fields:**
- `id` (BIGSERIAL) - Primary key
- `customer_id` (UUID) - Foreign key to customers table
- `name` (VARCHAR(150)) - Contact person name
- `email` (VARCHAR(150)) - Contact email
- `phone` (VARCHAR(20)) - Contact phone
- `designation` (VARCHAR(100)) - Job title/designation
- `department` (VARCHAR(100)) - Department
- `is_primary` (BOOLEAN) - Primary contact flag
- `is_billing_contact` (BOOLEAN) - Billing contact flag
- `is_shipping_contact` (BOOLEAN) - Shipping contact flag
- `is_technical_contact` (BOOLEAN) - Technical contact flag
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

**Indexes:**
- `idx_customer_contacts_customer_id` - Customer ID
- `idx_customer_contacts_email` - Contact email
- `idx_customer_contacts_phone` - Contact phone
- `idx_customer_contacts_primary` - Primary contact flag

### 3. customer_documents

Stores important documents related to customers.

**Fields:**
- `id` (BIGSERIAL) - Primary key
- `customer_id` (UUID) - Foreign key to customers table
- `document_type` (VARCHAR(50)) - Type of document
- `document_name` (VARCHAR(200)) - Document name
- `document_path` (VARCHAR(500)) - File path/URL
- `file_size` (BIGINT) - File size in bytes
- `file_type` (VARCHAR(50)) - MIME type
- `uploaded_by` (VARCHAR(150)) - User who uploaded
- `uploaded_at` (TIMESTAMP WITH TIME ZONE) - Upload timestamp
- `expires_at` (TIMESTAMP WITH TIME ZONE) - Expiration date
- `is_active` (BOOLEAN) - Active status

**Indexes:**
- `idx_customer_documents_customer_id` - Customer ID
- `idx_customer_documents_type` - Document type
- `idx_customer_documents_active` - Active status
- `idx_customer_documents_expires_at` - Expiration date

### 4. customer_notes

Stores internal notes and history for customer management.

**Fields:**
- `id` (BIGSERIAL) - Primary key
- `customer_id` (UUID) - Foreign key to customers table
- `note_type` (VARCHAR(50)) - Type of note
- `title` (VARCHAR(200)) - Note title
- `content` (TEXT) - Note content
- `created_by` (VARCHAR(150)) - User who created
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp

**Indexes:**
- `idx_customer_notes_customer_id` - Customer ID
- `idx_customer_notes_type` - Note type
- `idx_customer_notes_created_at` - Creation date

### 5. customer_audit_log

Tracks all changes made to customer records for audit and compliance.

**Fields:**
- `id` (BIGSERIAL) - Primary key
- `customer_id` (UUID) - Foreign key to customers table
- `action` (VARCHAR(50)) - Type of action (CREATE, UPDATE, DELETE)
- `changed_fields` (JSONB) - Fields that were changed
- `old_values` (JSONB) - Previous values
- `new_values` (JSONB) - New values
- `changed_by` (VARCHAR(150)) - User who made changes
- `ip_address` (INET) - IP address of the user
- `user_agent` (TEXT) - Browser/user agent
- `created_at` (TIMESTAMP WITH TIME ZONE) - Change timestamp

**Indexes:**
- `idx_customer_audit_log_customer_id` - Customer ID
- `idx_customer_audit_log_action` - Action type
- `idx_customer_audit_log_created_at` - Change timestamp

## Sample Data

The migration includes sample data for testing:

- **Customer**: Tech Solutions India Pvt Ltd (CUST-001)
- **Contacts**: 3 contacts (Purchase Manager, Design Engineer, Logistics Coordinator)
- **Documents**: NDA and GST Certificate
- **Notes**: Initial setup and compliance review notes

## Usage Examples

### Creating a Customer
```sql
INSERT INTO customers (
    customer_code, name, company_name, email, phone, status,
    billing_name, billing_address_line1, billing_city, billing_state, billing_pincode,
    shipping_name, shipping_address_line1, shipping_city, shipping_state, shipping_pincode,
    credit_limit, payment_terms_days, currency,
    compliance_nda_required, compliance_ip_sensitive
) VALUES (
    'CUST-002', 'John Doe', 'ABC Electronics', 'john@abcelectronics.com', '+1234567890', 'ACTIVE',
    'ABC Electronics', '123 Main St', 'New York', 'NY', '10001',
    'ABC Electronics', '123 Main St', 'New York', 'NY', '10001',
    100000.00, 45, 'USD',
    true, false
);
```

### Adding a Contact
```sql
INSERT INTO customer_contacts (
    customer_id, name, email, phone, designation, department, is_primary
) VALUES (
    (SELECT id FROM customers WHERE customer_code = 'CUST-002'),
    'Jane Smith', 'jane@abcelectronics.com', '+1234567891', 'Sales Manager', 'Sales', true
);
```

### Adding a Document
```sql
INSERT INTO customer_documents (
    customer_id, document_type, document_name, document_path, file_size, file_type, uploaded_by
) VALUES (
    (SELECT id FROM customers WHERE customer_code = 'CUST-002'),
    'MSA', 'Master Service Agreement', '/docs/msa/abcelectronics_msa.pdf', 204800, 'application/pdf', 'admin'
);
```

## Integration with Frontend

The schema is designed to work seamlessly with the frontend CustomerCreate.jsx component:

- **Address Management**: Separate billing and shipping addresses
- **Contact Management**: Multiple contacts with different roles
- **Document Storage**: Support for important compliance documents
- **Audit Trail**: Complete change tracking for compliance
- **PCB Preferences**: Industry-specific preferences for faster quoting

## Migration Version

This schema is implemented in migration file: `V2__create_customer_schema.sql`

## Dependencies

- Requires PostgreSQL with UUID extension
- Requires JSONB support for audit logging
- Requires proper permissions for trigger creation
- Depends on existing login schema (V1)

## Future Enhancements

Potential future additions:
- Customer tags/categories
- Customer hierarchy (parent-child relationships)
- Customer portal access management
- Integration with external CRM systems
- Advanced search and filtering capabilities