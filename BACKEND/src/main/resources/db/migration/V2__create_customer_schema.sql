-- Create customers table for sales module
-- Note: Requires uuid-ossp extension for gen_random_uuid() function
-- If not available, run: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    company_name VARCHAR(200),
    email VARCHAR(150),
    phone VARCHAR(20),
    website VARCHAR(200),
    gstin VARCHAR(20),
    pan VARCHAR(15),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    
    -- Billing Address
    billing_name VARCHAR(150),
    billing_address_line1 VARCHAR(200),
    billing_address_line2 VARCHAR(200),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_pincode VARCHAR(10),
    billing_country VARCHAR(50) DEFAULT 'India',
    billing_gstin VARCHAR(20),
    
    -- Shipping Address
    shipping_name VARCHAR(150),
    shipping_address_line1 VARCHAR(200),
    shipping_address_line2 VARCHAR(200),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_pincode VARCHAR(10),
    shipping_country VARCHAR(50) DEFAULT 'India',
    shipping_gstin VARCHAR(20),
    
    -- Credit Information
    credit_limit DECIMAL(15,2),
    payment_terms_days INTEGER,
    currency VARCHAR(5) DEFAULT 'INR',
    
    -- Compliance Flags
    compliance_nda_required BOOLEAN NOT NULL DEFAULT FALSE,
    compliance_ip_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    compliance_export_restricted BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- PCB Preferences
    preferred_finish VARCHAR(50),
    preferred_copper_oz VARCHAR(20),
    preferred_solder_mask VARCHAR(50),
    preferred_legend VARCHAR(50),
    preferred_packaging VARCHAR(100),
    preferred_courier VARCHAR(100),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_customer_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')),
    CONSTRAINT chk_customer_credit_limit_positive CHECK (credit_limit IS NULL OR credit_limit >= 0),
    CONSTRAINT chk_customer_payment_terms_positive CHECK (payment_terms_days IS NULL OR payment_terms_days >= 0),
    CONSTRAINT chk_customer_pincode_format CHECK (billing_pincode IS NULL OR billing_pincode ~ '^[0-9]{6}$'),
    CONSTRAINT chk_customer_shipping_pincode_format CHECK (shipping_pincode IS NULL OR shipping_pincode ~ '^[0-9]{6}$'),
    CONSTRAINT chk_customer_gstin_format CHECK (gstin IS NULL OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$'),
    CONSTRAINT chk_customer_pan_format CHECK (pan IS NULL OR pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$')
);

-- Create unique constraints for customer name and company name
CREATE UNIQUE INDEX idx_customers_name_unique ON customers(name) WHERE name IS NOT NULL;
CREATE UNIQUE INDEX idx_customers_company_name_unique ON customers(company_name) WHERE company_name IS NOT NULL;
CREATE UNIQUE INDEX idx_customers_customer_code_unique ON customers(customer_code) WHERE customer_code IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_company_name ON customers(company_name);
CREATE INDEX idx_customers_gstin ON customers(gstin);
CREATE INDEX idx_customers_pan ON customers(pan);
CREATE INDEX idx_customers_billing_city ON customers(billing_city);
CREATE INDEX idx_customers_shipping_city ON customers(shipping_city);
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_customers_updated_at ON customers(updated_at);

-- Create generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for customers
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create customer audit log table for tracking changes
CREATE TABLE customer_audit_log (
    id BIGSERIAL PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    changed_fields JSONB,
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(150),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit log
CREATE INDEX idx_customer_audit_log_customer_id ON customer_audit_log(customer_id);
CREATE INDEX idx_customer_audit_log_action ON customer_audit_log(action);
CREATE INDEX idx_customer_audit_log_created_at ON customer_audit_log(created_at);

-- Create customer contacts table for multiple contacts per customer
CREATE TABLE customer_contacts (
    id BIGSERIAL PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20),
    designation VARCHAR(100),
    department VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    is_billing_contact BOOLEAN DEFAULT FALSE,
    is_shipping_contact BOOLEAN DEFAULT FALSE,
    is_technical_contact BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for customer contacts
CREATE INDEX idx_customer_contacts_customer_id ON customer_contacts(customer_id);
CREATE INDEX idx_customer_contacts_email ON customer_contacts(email);
CREATE INDEX idx_customer_contacts_phone ON customer_contacts(phone);
CREATE INDEX idx_customer_contacts_primary ON customer_contacts(is_primary);

-- Create trigger for customer contacts updated_at
CREATE TRIGGER update_customer_contacts_updated_at 
    BEFORE UPDATE ON customer_contacts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create customer documents table for storing documents like NDA, certificates, etc.
CREATE TABLE customer_documents (
    id BIGSERIAL PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(200) NOT NULL,
    document_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    uploaded_by VARCHAR(150),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for customer documents
CREATE INDEX idx_customer_documents_customer_id ON customer_documents(customer_id);
CREATE INDEX idx_customer_documents_type ON customer_documents(document_type);
CREATE INDEX idx_customer_documents_active ON customer_documents(is_active);
CREATE INDEX idx_customer_documents_expires_at ON customer_documents(expires_at);

-- Create customer notes table for detailed notes and history
CREATE TABLE customer_notes (
    id BIGSERIAL PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    note_type VARCHAR(50) DEFAULT 'GENERAL',
    title VARCHAR(200),
    content TEXT NOT NULL,
    created_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for customer notes
CREATE INDEX idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX idx_customer_notes_type ON customer_notes(note_type);
CREATE INDEX idx_customer_notes_created_at ON customer_notes(created_at);
