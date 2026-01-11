-- Settings Module Database Schema
-- Creates tables for company settings, plants, numbering series, and integrations
-- Version: V14
-- Date: 2025-01-11
-- Assumes update_updated_at_column() function is available from earlier migrations

-- Company Settings table
-- Stores company-wide configuration and information
CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(200),
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(200),
    website VARCHAR(200),
    currency VARCHAR(3),
    timezone VARCHAR(50),
    fiscal_year_start INTEGER,
    fiscal_year_end INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    CONSTRAINT chk_company_fiscal_year_start CHECK (fiscal_year_start IS NULL OR (fiscal_year_start >= 1 AND fiscal_year_start <= 12)),
    CONSTRAINT chk_company_fiscal_year_end CHECK (fiscal_year_end IS NULL OR (fiscal_year_end >= 1 AND fiscal_year_end <= 12))
);

-- Plants table
-- Stores manufacturing plant information and configurations
CREATE TABLE plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_code VARCHAR(50) NOT NULL UNIQUE,
    plant_name VARCHAR(200) NOT NULL,
    description TEXT,
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(200),
    manager_name VARCHAR(200),
    manager_email VARCHAR(200),
    manager_phone VARCHAR(20),
    working_hours_start VARCHAR(10),
    working_hours_end VARCHAR(10),
    timezone VARCHAR(50),
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Numbering Series table
-- Stores document numbering configuration and sequences
CREATE TABLE numbering_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_name VARCHAR(100) NOT NULL,
    description TEXT,
    prefix VARCHAR(50),
    suffix VARCHAR(50),
    start_number INTEGER NOT NULL DEFAULT 1,
    current_number INTEGER NOT NULL DEFAULT 1,
    increment_by INTEGER NOT NULL DEFAULT 1,
    reset_frequency VARCHAR(20),
    enabled BOOLEAN NOT NULL DEFAULT true,
    format_pattern VARCHAR(100),
    length INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_numbering_series_start_number CHECK (start_number > 0),
    CONSTRAINT chk_numbering_series_current_number CHECK (current_number > 0),
    CONSTRAINT chk_numbering_series_increment_by CHECK (increment_by > 0),
    CONSTRAINT chk_numbering_series_length CHECK (length > 0)
);

-- Integrations table
-- Stores external system integration configurations
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_type VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT false,
    config TEXT,
    api_key VARCHAR(500),
    api_secret VARCHAR(500),
    base_url VARCHAR(500),
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(500),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization

-- Company Settings indexes
CREATE INDEX idx_company_settings_name ON company_settings(company_name);
CREATE INDEX idx_company_settings_is_active ON company_settings(is_active);
CREATE INDEX idx_company_settings_currency ON company_settings(currency);
CREATE INDEX idx_company_settings_timezone ON company_settings(timezone);
CREATE INDEX idx_company_settings_created_at ON company_settings(created_at);
CREATE INDEX idx_company_settings_updated_at ON company_settings(updated_at);

-- Plants indexes
CREATE INDEX idx_plants_code ON plants(plant_code);
CREATE INDEX idx_plants_name ON plants(plant_name);
CREATE INDEX idx_plants_enabled ON plants(enabled);
CREATE INDEX idx_plants_country ON plants(country);
CREATE INDEX idx_plants_state ON plants(state);
CREATE INDEX idx_plants_manager_email ON plants(manager_email);
CREATE INDEX idx_plants_created_at ON plants(created_at);
CREATE INDEX idx_plants_updated_at ON plants(updated_at);

-- Numbering Series indexes
CREATE INDEX idx_numbering_series_name ON numbering_series(series_name);
CREATE INDEX idx_numbering_series_enabled ON numbering_series(enabled);
CREATE INDEX idx_numbering_series_reset_frequency ON numbering_series(reset_frequency);
CREATE INDEX idx_numbering_series_created_at ON numbering_series(created_at);
CREATE INDEX idx_numbering_series_updated_at ON numbering_series(updated_at);

-- Integrations indexes
CREATE INDEX idx_integrations_type ON integrations(integration_type);
CREATE INDEX idx_integrations_name ON integrations(name);
CREATE INDEX idx_integrations_enabled ON integrations(enabled);
CREATE INDEX idx_integrations_last_sync_status ON integrations(last_sync_status);
CREATE INDEX idx_integrations_created_at ON integrations(created_at);
CREATE INDEX idx_integrations_updated_at ON integrations(updated_at);

-- Check constraints for enum values

-- Numbering Series reset frequency constraints
ALTER TABLE numbering_series 
    ADD CONSTRAINT chk_numbering_series_reset_frequency 
    CHECK (reset_frequency IN ('NEVER', 'DAILY', 'MONTHLY', 'YEARLY'));

-- Integrations type constraints
ALTER TABLE integrations 
    ADD CONSTRAINT chk_integrations_type 
    CHECK (integration_type IN ('ACCOUNTING', 'EMAIL_SMTP', 'BARCODE', 'ERP_WEBHOOKS'));

-- Integrations sync status constraints
ALTER TABLE integrations 
    ADD CONSTRAINT chk_integrations_sync_status 
    CHECK (last_sync_status IN ('SUCCESS', 'FAILED', 'IN_PROGRESS', 'PENDING'));

-- Triggers for updated_at timestamps
CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plants_updated_at
    BEFORE UPDATE ON plants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_numbering_series_updated_at
    BEFORE UPDATE ON numbering_series
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE company_settings IS 'Stores company-wide configuration and information';
COMMENT ON TABLE plants IS 'Stores manufacturing plant information and configurations';
COMMENT ON TABLE numbering_series IS 'Stores document numbering configuration and sequences';
COMMENT ON TABLE integrations IS 'Stores external system integration configurations';

COMMENT ON COLUMN company_settings.company_name IS 'Primary company name for display';
COMMENT ON COLUMN company_settings.legal_name IS 'Legal/registered company name';
COMMENT ON COLUMN company_settings.registration_number IS 'Company registration number';
COMMENT ON COLUMN company_settings.tax_id IS 'Tax identification number';
COMMENT ON COLUMN company_settings.fiscal_year_start IS 'Fiscal year start month (1-12)';
COMMENT ON COLUMN company_settings.fiscal_year_end IS 'Fiscal year end month (1-12)';
COMMENT ON COLUMN company_settings.is_active IS 'Indicates if company settings are active';

COMMENT ON COLUMN plants.plant_code IS 'Unique code identifier for the plant';
COMMENT ON COLUMN plants.plant_name IS 'Display name for the plant';
COMMENT ON COLUMN plants.enabled IS 'Indicates if plant is enabled for operations';
COMMENT ON COLUMN plants.manager_name IS 'Plant manager name';
COMMENT ON COLUMN plants.manager_email IS 'Plant manager email address';
COMMENT ON COLUMN plants.working_hours_start IS 'Plant working hours start time';
COMMENT ON COLUMN plants.working_hours_end IS 'Plant working hours end time';

COMMENT ON COLUMN numbering_series.series_name IS 'Name of the numbering series';
COMMENT ON COLUMN numbering_series.prefix IS 'Prefix for generated numbers';
COMMENT ON COLUMN numbering_series.suffix IS 'Suffix for generated numbers';
COMMENT ON COLUMN numbering_series.start_number IS 'Starting number for the sequence';
COMMENT ON COLUMN numbering_series.current_number IS 'Current number in the sequence';
COMMENT ON COLUMN numbering_series.increment_by IS 'Increment value for each new number';
COMMENT ON COLUMN numbering_series.reset_frequency IS 'Frequency for resetting the sequence (NEVER, DAILY, MONTHLY, YEARLY)';
COMMENT ON COLUMN numbering_series.format_pattern IS 'Custom format pattern for number generation';
COMMENT ON COLUMN numbering_series.length IS 'Length of the numeric portion';

COMMENT ON COLUMN integrations.integration_type IS 'Type of integration (ACCOUNTING, EMAIL_SMTP, BARCODE, ERP_WEBHOOKS)';
COMMENT ON COLUMN integrations.name IS 'Display name for the integration';
COMMENT ON COLUMN integrations.enabled IS 'Indicates if integration is enabled';
COMMENT ON COLUMN integrations.config IS 'JSON configuration for the integration';
COMMENT ON COLUMN integrations.api_key IS 'API key for external service authentication';
COMMENT ON COLUMN integrations.api_secret IS 'API secret for external service authentication';
COMMENT ON COLUMN integrations.base_url IS 'Base URL for API endpoints';
COMMENT ON COLUMN integrations.webhook_url IS 'URL for receiving webhook notifications';
COMMENT ON COLUMN integrations.webhook_secret IS 'Secret for webhook authentication';
COMMENT ON COLUMN integrations.last_sync_at IS 'Timestamp of last synchronization';
COMMENT ON COLUMN integrations.last_sync_status IS 'Status of last synchronization (SUCCESS, FAILED, IN_PROGRESS, PENDING)';

-- Display completion message
SELECT 'Settings module tables created successfully' AS migration_status;