-- Quality Module Database Schema
-- Creates tables for AOI, CAPA, and Certificates modules
-- Version: V12
-- Date: 2025-01-11
-- Assumes update_updated_at_column() function is available from earlier migrations

-- AOI Defects table
-- Stores master data for AOI defect types and categories
CREATE TABLE aoi_defects (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    severity VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_aoi_defects_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_aoi_defects_side CHECK (side IN ('TOP', 'BOTTOM', 'BOTH'))
);

-- AOI Queue table
-- Tracks items waiting for AOI inspection
CREATE TABLE aoi_queue (
    id SERIAL PRIMARY KEY,
    job_no VARCHAR(100) NOT NULL,
    work_order_no VARCHAR(100) NOT NULL,
    customer VARCHAR(200) NOT NULL,
    part_no VARCHAR(100) NOT NULL,
    revision VARCHAR(50),
    layer_count INTEGER NOT NULL,
    line VARCHAR(100) NOT NULL,
    machine VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    panels INTEGER NOT NULL,
    boards INTEGER NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    hold_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_aoi_queue_status CHECK (status IN ('QUEUED', 'RUNNING', 'HOLD', 'DONE')),
    CONSTRAINT chk_aoi_queue_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    CONSTRAINT chk_aoi_queue_panels CHECK (panels > 0),
    CONSTRAINT chk_aoi_queue_boards CHECK (boards > 0)
);

-- AOI Results table
-- Stores inspection results and outcomes
CREATE TABLE aoi_results (
    id SERIAL PRIMARY KEY,
    job_no VARCHAR(100) NOT NULL,
    work_order_no VARCHAR(100) NOT NULL,
    customer VARCHAR(200) NOT NULL,
    part_no VARCHAR(100) NOT NULL,
    revision VARCHAR(50),
    layer_count INTEGER NOT NULL,
    line VARCHAR(100) NOT NULL,
    machine VARCHAR(100) NOT NULL,
    inspected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    result_status VARCHAR(20) NOT NULL,
    defect_count INTEGER NOT NULL DEFAULT 0,
    severity VARCHAR(20) NOT NULL,
    program_name VARCHAR(100),
    operator VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_aoi_results_status CHECK (result_status IN ('PASS', 'FAIL', 'REWORK', 'SCRAP')),
    CONSTRAINT chk_aoi_results_severity CHECK (severity IN ('MINOR', 'MAJOR', 'CRITICAL')),
    CONSTRAINT chk_aoi_results_defect_count CHECK (defect_count >= 0)
);

-- AOI Defect Details table
-- Stores detailed defect information for each inspection result
CREATE TABLE aoi_defect_details (
    id SERIAL PRIMARY KEY,
    aoi_result_id INTEGER NOT NULL REFERENCES aoi_results(id) ON DELETE CASCADE,
    code VARCHAR(50),
    name VARCHAR(200),
    side VARCHAR(10),
    x DOUBLE PRECISION,
    y DOUBLE PRECISION,
    severity VARCHAR(20),
    comment TEXT,
    
    CONSTRAINT chk_aoi_defect_details_side CHECK (side IN ('TOP', 'BOTTOM', 'BOTH')),
    CONSTRAINT chk_aoi_defect_details_severity CHECK (severity IN ('MINOR', 'MAJOR', 'CRITICAL'))
);

-- CAPA table
-- Stores Corrective and Preventive Actions
CREATE TABLE capa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capa_no VARCHAR(100) UNIQUE,
    source_type VARCHAR(50) NOT NULL,
    reference_no VARCHAR(100),
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    title VARCHAR(500) NOT NULL,
    problem_statement TEXT,
    affected_process VARCHAR(200),
    part_no VARCHAR(100),
    job_no VARCHAR(100),
    lot_no VARCHAR(100),
    containment_action TEXT,
    root_cause_method VARCHAR(50),
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    owner_name VARCHAR(200) NOT NULL,
    owner_department VARCHAR(100),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    effectiveness_criteria TEXT,
    notes TEXT,
    created_by VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_capa_source_type CHECK (source_type IN ('NCR', 'AOI', 'ETEST', 'INCOMING_QC', 'INPROCESS_QC', 'FINAL_QC', 'CUSTOMER_COMPLAINT', 'AUDIT')),
    CONSTRAINT chk_capa_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_capa_status CHECK (status IN ('DRAFT', 'OPEN', 'IN_PROGRESS', 'VERIFIED', 'CLOSED', 'REJECTED')),
    CONSTRAINT chk_capa_root_cause_method CHECK (root_cause_method IN ('FIVE_WHY', 'FISHBONE', 'EIGHT_D', 'OTHER'))
);

-- Certificates of Compliance (CoC) table
-- Stores Certificate of Compliance documents
CREATE TABLE certificates_coc (
    id SERIAL PRIMARY KEY,
    coc_no VARCHAR(100) UNIQUE,
    order_no VARCHAR(100) NOT NULL,
    customer VARCHAR(200),
    po_no VARCHAR(100),
    pcb_type VARCHAR(100),
    finish VARCHAR(100),
    quantity INTEGER,
    lot_no VARCHAR(100),
    work_order_no VARCHAR(100),
    shipment_id VARCHAR(100),
    carrier VARCHAR(100),
    awb VARCHAR(100),
    ship_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL,
    template_id VARCHAR(100),
    include_test_reports BOOLEAN,
    include_aoi_summary BOOLEAN,
    include_etch_coupons BOOLEAN,
    notes TEXT,
    generated_by VARCHAR(200),
    generated_at TIMESTAMP WITH TIME ZONE,
    sent_to VARCHAR(200),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_coc_status CHECK (status IN ('DRAFT', 'READY', 'SENT', 'CANCELLED')),
    CONSTRAINT chk_coc_quantity CHECK (quantity IS NULL OR quantity > 0)
);

-- Compliance Documents table
-- Stores general compliance documentation
CREATE TABLE certificates_compliance_docs (
    id SERIAL PRIMARY KEY,
    document_no VARCHAR(100) UNIQUE,
    order_no VARCHAR(100) NOT NULL,
    customer VARCHAR(200),
    po_no VARCHAR(100),
    pcb_type VARCHAR(100),
    finish VARCHAR(100),
    quantity INTEGER,
    lot_no VARCHAR(100),
    work_order_no VARCHAR(100),
    shipment_id VARCHAR(100),
    carrier VARCHAR(100),
    awb VARCHAR(100),
    ship_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL,
    template_id VARCHAR(100),
    include_test_reports BOOLEAN,
    include_aoi_summary BOOLEAN,
    include_etch_coupons BOOLEAN,
    notes TEXT,
    generated_by VARCHAR(200),
    generated_at TIMESTAMP WITH TIME ZONE,
    sent_to VARCHAR(200),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Compliance-specific fields
    document_type VARCHAR(100),
    document_title VARCHAR(500),
    document_version VARCHAR(50),
    document_date TIMESTAMP WITH TIME ZONE,
    document_author VARCHAR(200),
    document_approver VARCHAR(200),
    approval_date TIMESTAMP WITH TIME ZONE,
    compliance_standard VARCHAR(200),
    compliance_reference VARCHAR(200),
    compliance_level VARCHAR(50),
    compliance_scope TEXT,
    compliance_requirements TEXT,
    compliance_evidence TEXT,
    compliance_status VARCHAR(50),
    compliance_review_date TIMESTAMP WITH TIME ZONE,
    compliance_reviewer VARCHAR(200),
    compliance_comments TEXT,
    document_url VARCHAR(500),
    document_path VARCHAR(500),
    document_size VARCHAR(50),
    document_format VARCHAR(20),
    is_public BOOLEAN,
    is_archived BOOLEAN,
    archive_date TIMESTAMP WITH TIME ZONE,
    archive_reason TEXT,
    archive_location VARCHAR(200),
    
    CONSTRAINT chk_compliance_docs_status CHECK (status IN ('DRAFT', 'READY', 'SENT', 'CANCELLED', 'ARCHIVED')),
    CONSTRAINT chk_compliance_docs_quantity CHECK (quantity IS NULL OR quantity > 0)
);

-- RoHS/REACH Certificates table
-- Stores RoHS and REACH compliance certificates
CREATE TABLE certificates_rohs_reach (
    id SERIAL PRIMARY KEY,
    certificate_no VARCHAR(100) UNIQUE,
    order_no VARCHAR(100) NOT NULL,
    customer VARCHAR(200),
    po_no VARCHAR(100),
    pcb_type VARCHAR(100),
    finish VARCHAR(100),
    quantity INTEGER,
    lot_no VARCHAR(100),
    work_order_no VARCHAR(100),
    shipment_id VARCHAR(100),
    carrier VARCHAR(100),
    awb VARCHAR(100),
    ship_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL,
    template_id VARCHAR(100),
    include_test_reports BOOLEAN,
    include_aoi_summary BOOLEAN,
    include_etch_coupons BOOLEAN,
    notes TEXT,
    generated_by VARCHAR(200),
    generated_at TIMESTAMP WITH TIME ZONE,
    sent_to VARCHAR(200),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- RoHS/REACH specific fields
    rohs_compliance VARCHAR(100),
    reach_compliance VARCHAR(100),
    restricted_substances TEXT,
    compliance_date TIMESTAMP WITH TIME ZONE,
    compliance_officer VARCHAR(200),
    test_lab VARCHAR(200),
    test_report_no VARCHAR(100),
    test_date TIMESTAMP WITH TIME ZONE,
    test_method VARCHAR(200),
    certificate_authority VARCHAR(200),
    certificate_reference VARCHAR(200),
    certificate_expiry TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT chk_rohs_reach_status CHECK (status IN ('DRAFT', 'READY', 'SENT', 'CANCELLED')),
    CONSTRAINT chk_rohs_reach_quantity CHECK (quantity IS NULL OR quantity > 0)
);

-- Indexes for performance optimization

-- AOI Defects indexes
CREATE INDEX idx_aoi_defects_code ON aoi_defects(code);
CREATE INDEX idx_aoi_defects_name ON aoi_defects(name);
CREATE INDEX idx_aoi_defects_category ON aoi_defects(category);
CREATE INDEX idx_aoi_defects_severity ON aoi_defects(severity);
CREATE INDEX idx_aoi_defects_side ON aoi_defects(side);
CREATE INDEX idx_aoi_defects_active ON aoi_defects(is_active);
CREATE INDEX idx_aoi_defects_created_at ON aoi_defects(created_at);
CREATE INDEX idx_aoi_defects_updated_at ON aoi_defects(updated_at);

-- AOI Queue indexes
CREATE INDEX idx_aoi_queue_job_no ON aoi_queue(job_no);
CREATE INDEX idx_aoi_queue_work_order_no ON aoi_queue(work_order_no);
CREATE INDEX idx_aoi_queue_customer ON aoi_queue(customer);
CREATE INDEX idx_aoi_queue_part_no ON aoi_queue(part_no);
CREATE INDEX idx_aoi_queue_status ON aoi_queue(status);
CREATE INDEX idx_aoi_queue_priority ON aoi_queue(priority);
CREATE INDEX idx_aoi_queue_line ON aoi_queue(line);
CREATE INDEX idx_aoi_queue_machine ON aoi_queue(machine);
CREATE INDEX idx_aoi_queue_due_date ON aoi_queue(due_date);
CREATE INDEX idx_aoi_queue_created_at ON aoi_queue(created_at);
CREATE INDEX idx_aoi_queue_updated_at ON aoi_queue(updated_at);

-- AOI Results indexes
CREATE INDEX idx_aoi_results_job_no ON aoi_results(job_no);
CREATE INDEX idx_aoi_results_work_order_no ON aoi_results(work_order_no);
CREATE INDEX idx_aoi_results_customer ON aoi_results(customer);
CREATE INDEX idx_aoi_results_part_no ON aoi_results(part_no);
CREATE INDEX idx_aoi_results_status ON aoi_results(result_status);
CREATE INDEX idx_aoi_results_severity ON aoi_results(severity);
CREATE INDEX idx_aoi_results_inspected_at ON aoi_results(inspected_at);
CREATE INDEX idx_aoi_results_operator ON aoi_results(operator);
CREATE INDEX idx_aoi_results_created_at ON aoi_results(created_at);
CREATE INDEX idx_aoi_results_updated_at ON aoi_results(updated_at);

-- AOI Defect Details indexes
CREATE INDEX idx_aoi_defect_details_result_id ON aoi_defect_details(aoi_result_id);
CREATE INDEX idx_aoi_defect_details_code ON aoi_defect_details(code);
CREATE INDEX idx_aoi_defect_details_name ON aoi_defect_details(name);
CREATE INDEX idx_aoi_defect_details_side ON aoi_defect_details(side);
CREATE INDEX idx_aoi_defect_details_severity ON aoi_defect_details(severity);

-- CAPA indexes
CREATE INDEX idx_capa_no ON capa(capa_no);
CREATE INDEX idx_capa_source_type ON capa(source_type);
CREATE INDEX idx_capa_severity ON capa(severity);
CREATE INDEX idx_capa_status ON capa(status);
CREATE INDEX idx_capa_title ON capa(title);
CREATE INDEX idx_capa_owner_name ON capa(owner_name);
CREATE INDEX idx_capa_due_date ON capa(due_date);
CREATE INDEX idx_capa_created_at ON capa(created_at);
CREATE INDEX idx_capa_updated_at ON capa(updated_at);

-- Certificates CoC indexes
CREATE INDEX idx_coc_no ON certificates_coc(coc_no);
CREATE INDEX idx_coc_order_no ON certificates_coc(order_no);
CREATE INDEX idx_coc_customer ON certificates_coc(customer);
CREATE INDEX idx_coc_status ON certificates_coc(status);
CREATE INDEX idx_coc_lot_no ON certificates_coc(lot_no);
CREATE INDEX idx_coc_work_order_no ON certificates_coc(work_order_no);
CREATE INDEX idx_coc_ship_date ON certificates_coc(ship_date);
CREATE INDEX idx_coc_created_at ON certificates_coc(created_at);
CREATE INDEX idx_coc_updated_at ON certificates_coc(updated_at);

-- Compliance Docs indexes
CREATE INDEX idx_compliance_docs_no ON certificates_compliance_docs(document_no);
CREATE INDEX idx_compliance_docs_order_no ON certificates_compliance_docs(order_no);
CREATE INDEX idx_compliance_docs_customer ON certificates_compliance_docs(customer);
CREATE INDEX idx_compliance_docs_status ON certificates_compliance_docs(status);
CREATE INDEX idx_compliance_docs_type ON certificates_compliance_docs(document_type);
CREATE INDEX idx_compliance_docs_standard ON certificates_compliance_docs(compliance_standard);
CREATE INDEX idx_compliance_docs_created_at ON certificates_compliance_docs(created_at);
CREATE INDEX idx_compliance_docs_updated_at ON certificates_compliance_docs(updated_at);

-- RoHS/REACH indexes
CREATE INDEX idx_rohs_reach_no ON certificates_rohs_reach(certificate_no);
CREATE INDEX idx_rohs_reach_order_no ON certificates_rohs_reach(order_no);
CREATE INDEX idx_rohs_reach_customer ON certificates_rohs_reach(customer);
CREATE INDEX idx_rohs_reach_status ON certificates_rohs_reach(status);
CREATE INDEX idx_rohs_reach_compliance_date ON certificates_rohs_reach(compliance_date);
CREATE INDEX idx_rohs_reach_certificate_expiry ON certificates_rohs_reach(certificate_expiry);
CREATE INDEX idx_rohs_reach_created_at ON certificates_rohs_reach(created_at);
CREATE INDEX idx_rohs_reach_updated_at ON certificates_rohs_reach(updated_at);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_aoi_defects_updated_at
    BEFORE UPDATE ON aoi_defects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aoi_queue_updated_at
    BEFORE UPDATE ON aoi_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aoi_results_updated_at
    BEFORE UPDATE ON aoi_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capa_updated_at
    BEFORE UPDATE ON capa
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_coc_updated_at
    BEFORE UPDATE ON certificates_coc
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_compliance_docs_updated_at
    BEFORE UPDATE ON certificates_compliance_docs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_rohs_reach_updated_at
    BEFORE UPDATE ON certificates_rohs_reach
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE aoi_defects IS 'Stores master data for AOI defect types and categories';
COMMENT ON TABLE aoi_queue IS 'Tracks items waiting for AOI inspection';
COMMENT ON TABLE aoi_results IS 'Stores inspection results and outcomes';
COMMENT ON TABLE aoi_defect_details IS 'Stores detailed defect information for each inspection result';
COMMENT ON TABLE capa IS 'Stores Corrective and Preventive Actions';
COMMENT ON TABLE certificates_coc IS 'Stores Certificate of Compliance documents';
COMMENT ON TABLE certificates_compliance_docs IS 'Stores general compliance documentation';
COMMENT ON TABLE certificates_rohs_reach IS 'Stores RoHS and REACH compliance certificates';

COMMENT ON COLUMN aoi_defects.code IS 'Unique identifier for the defect type';
COMMENT ON COLUMN aoi_defects.severity IS 'Severity level of the defect (LOW, MEDIUM, HIGH, CRITICAL)';
COMMENT ON COLUMN aoi_defects.side IS 'PCB side where defect occurs (TOP, BOTTOM, BOTH)';
COMMENT ON COLUMN aoi_queue.status IS 'Current status of the inspection queue item (QUEUED, RUNNING, HOLD, DONE)';
COMMENT ON COLUMN aoi_queue.priority IS 'Priority level of the inspection (LOW, NORMAL, HIGH, URGENT)';
COMMENT ON COLUMN aoi_results.result_status IS 'Inspection result status (PASS, FAIL, REWORK, SCRAP)';
COMMENT ON COLUMN aoi_results.severity IS 'Overall severity of the inspection (MINOR, MAJOR, CRITICAL)';
COMMENT ON COLUMN capa.source_type IS 'Source of the CAPA request (NCR, AOI, ETEST, etc.)';
COMMENT ON COLUMN capa.status IS 'Current status of the CAPA (DRAFT, OPEN, IN_PROGRESS, VERIFIED, CLOSED, REJECTED)';
COMMENT ON COLUMN certificates_coc.status IS 'Certificate status (DRAFT, READY, SENT, CANCELLED)';
COMMENT ON COLUMN certificates_compliance_docs.document_type IS 'Type of compliance document';
COMMENT ON COLUMN certificates_rohs_reach.rohs_compliance IS 'RoHS compliance status';
COMMENT ON COLUMN certificates_rohs_reach.reach_compliance IS 'REACH compliance status';

-- Display completion message
SELECT 'Quality module tables created successfully' AS migration_status;