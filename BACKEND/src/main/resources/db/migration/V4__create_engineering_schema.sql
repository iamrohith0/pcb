-- Engineering module schema (CAM, DFM, Stackup, Panelization, Revisions, ECO)
-- Assumes update_updated_at_column() is available from earlier migrations.

-- Stackup material rules (capability constraints)
CREATE TABLE engineering_stackup_material_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    layers INTEGER,
    dielectric_families TEXT[],
    tg VARCHAR(50),
    thickness_min_mm DECIMAL(8,3),
    thickness_max_mm DECIMAL(8,3),
    copper_outer VARCHAR(20),
    copper_inner VARCHAR(20),
    impedance BOOLEAN NOT NULL DEFAULT FALSE,
    min_trace_mil DECIMAL(6,2),
    min_space_mil DECIMAL(6,2),
    min_drill_mm DECIMAL(6,3),
    annular_ring_mm DECIMAL(6,3),
    risk VARCHAR(20),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    updated_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_stackup_rule_layers CHECK (layers IS NULL OR layers >= 1),
    CONSTRAINT chk_stackup_rule_thickness_min CHECK (thickness_min_mm IS NULL OR thickness_min_mm >= 0),
    CONSTRAINT chk_stackup_rule_thickness_max CHECK (thickness_max_mm IS NULL OR thickness_max_mm >= 0),
    CONSTRAINT chk_stackup_rule_min_trace CHECK (min_trace_mil IS NULL OR min_trace_mil >= 0),
    CONSTRAINT chk_stackup_rule_min_space CHECK (min_space_mil IS NULL OR min_space_mil >= 0),
    CONSTRAINT chk_stackup_rule_min_drill CHECK (min_drill_mm IS NULL OR min_drill_mm >= 0),
    CONSTRAINT chk_stackup_rule_annular CHECK (annular_ring_mm IS NULL OR annular_ring_mm >= 0)
);

CREATE INDEX idx_stackup_rules_layers ON engineering_stackup_material_rules(layers);
CREATE INDEX idx_stackup_rules_active ON engineering_stackup_material_rules(active);

CREATE TRIGGER update_stackup_rules_updated_at
    BEFORE UPDATE ON engineering_stackup_material_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Stackup templates
CREATE TABLE engineering_stackup_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50),
    layers INTEGER NOT NULL,
    material_family VARCHAR(50),
    tg VARCHAR(50),
    finish VARCHAR(50),
    soldermask VARCHAR(50),
    silkscreen VARCHAR(50),
    impedance BOOLEAN NOT NULL DEFAULT FALSE,
    target_thickness_mm DECIMAL(8,3),
    thickness_tol_plus_mm DECIMAL(8,3),
    thickness_tol_minus_mm DECIMAL(8,3),
    copper_outer VARCHAR(20),
    copper_inner_default VARCHAR(20),
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    default_rule_id UUID REFERENCES engineering_stackup_material_rules(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_stackup_template_layers CHECK (layers >= 1),
    CONSTRAINT chk_stackup_template_thickness CHECK (target_thickness_mm IS NULL OR target_thickness_mm >= 0)
);

CREATE INDEX idx_stackup_templates_layers ON engineering_stackup_templates(layers);
CREATE INDEX idx_stackup_templates_active ON engineering_stackup_templates(active);

CREATE TRIGGER update_stackup_templates_updated_at
    BEFORE UPDATE ON engineering_stackup_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE engineering_stackup_dielectrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES engineering_stackup_templates(id) ON DELETE CASCADE,
    sequence_no INTEGER NOT NULL,
    name VARCHAR(100),
    thickness_mm DECIMAL(8,3),
    material VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_stackup_dielectric_seq CHECK (sequence_no >= 1),
    CONSTRAINT chk_stackup_dielectric_thickness CHECK (thickness_mm IS NULL OR thickness_mm >= 0)
);

CREATE INDEX idx_stackup_dielectrics_template_id ON engineering_stackup_dielectrics(template_id);

CREATE TRIGGER update_stackup_dielectrics_updated_at
    BEFORE UPDATE ON engineering_stackup_dielectrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Engineering revisions (release packages)
CREATE TABLE engineering_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_code VARCHAR(100) NOT NULL,
    base_revision VARCHAR(20),
    new_revision VARCHAR(20),
    title VARCHAR(200),
    layers INTEGER,
    thickness VARCHAR(50),
    finish VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    created_by VARCHAR(150),
    checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_engineering_revisions_job_code ON engineering_revisions(job_code);
CREATE INDEX idx_engineering_revisions_status ON engineering_revisions(status);
CREATE INDEX idx_engineering_revisions_created_at ON engineering_revisions(created_at);

CREATE TRIGGER update_engineering_revisions_updated_at
    BEFORE UPDATE ON engineering_revisions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Engineering change requests (ECO)
CREATE TABLE engineering_eco_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eco_no VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    project_code VARCHAR(100),
    customer VARCHAR(200),
    reason TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    owner VARCHAR(150),
    affected JSONB NOT NULL DEFAULT '[]'::jsonb,
    revision_from VARCHAR(20),
    revision_to VARCHAR(20),
    requested_by VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_engineering_eco_status ON engineering_eco_requests(status);
CREATE INDEX idx_engineering_eco_priority ON engineering_eco_requests(priority);
CREATE INDEX idx_engineering_eco_project ON engineering_eco_requests(project_code);

CREATE TRIGGER update_engineering_eco_updated_at
    BEFORE UPDATE ON engineering_eco_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Panelization templates
CREATE TABLE engineering_panel_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by VARCHAR(150),
    tags TEXT[],
    defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_panel_templates_status ON engineering_panel_templates(status);

CREATE TRIGGER update_panel_templates_updated_at
    BEFORE UPDATE ON engineering_panel_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- CAM jobs
CREATE TABLE engineering_cam_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cam_no VARCHAR(50) UNIQUE NOT NULL,
    board_name VARCHAR(200) NOT NULL,
    revision VARCHAR(20),
    layers INTEGER,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(200),
    rfq_no VARCHAR(50),
    sales_order_no VARCHAR(50),
    priority VARCHAR(20) NOT NULL DEFAULT 'Normal',
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    due_date DATE,
    assigned_to VARCHAR(150),
    notes TEXT,
    stackup_id UUID REFERENCES engineering_stackup_templates(id) ON DELETE SET NULL,
    panelization_id UUID REFERENCES engineering_panel_templates(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    files JSONB NOT NULL DEFAULT '[]'::jsonb,
    checkpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
    outputs JSONB NOT NULL DEFAULT '[]'::jsonb,
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_cam_jobs_layers CHECK (layers IS NULL OR layers >= 1)
);

CREATE INDEX idx_cam_jobs_cam_no ON engineering_cam_jobs(cam_no);
CREATE INDEX idx_cam_jobs_status ON engineering_cam_jobs(status);
CREATE INDEX idx_cam_jobs_priority ON engineering_cam_jobs(priority);
CREATE INDEX idx_cam_jobs_rfq_no ON engineering_cam_jobs(rfq_no);
CREATE INDEX idx_cam_jobs_sales_order_no ON engineering_cam_jobs(sales_order_no);

CREATE TRIGGER update_cam_jobs_updated_at
    BEFORE UPDATE ON engineering_cam_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- CAM outputs (Gerber/ODB++/reports)
CREATE TABLE engineering_cam_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    output_no VARCHAR(50) UNIQUE NOT NULL,
    cam_job_id UUID REFERENCES engineering_cam_jobs(id) ON DELETE SET NULL,
    cam_no VARCHAR(50),
    rfq_no VARCHAR(50),
    sales_order_no VARCHAR(50),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(200),
    board_name VARCHAR(200),
    revision VARCHAR(20),
    type VARCHAR(50),
    format VARCHAR(50),
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size BIGINT,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cam_outputs_output_no ON engineering_cam_outputs(output_no);
CREATE INDEX idx_cam_outputs_cam_no ON engineering_cam_outputs(cam_no);
CREATE INDEX idx_cam_outputs_rfq_no ON engineering_cam_outputs(rfq_no);
CREATE INDEX idx_cam_outputs_sales_order_no ON engineering_cam_outputs(sales_order_no);
CREATE INDEX idx_cam_outputs_type ON engineering_cam_outputs(type);
CREATE INDEX idx_cam_outputs_status ON engineering_cam_outputs(status);

CREATE TRIGGER update_cam_outputs_updated_at
    BEFORE UPDATE ON engineering_cam_outputs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- DFM checklists
CREATE TABLE engineering_dfm_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_no VARCHAR(50),
    sales_order_no VARCHAR(50),
    cam_no VARCHAR(50),
    board_name VARCHAR(200),
    revision VARCHAR(20),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by VARCHAR(150),
    updated_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dfm_checklists_rfq_no ON engineering_dfm_checklists(rfq_no);
CREATE INDEX idx_dfm_checklists_sales_order_no ON engineering_dfm_checklists(sales_order_no);
CREATE INDEX idx_dfm_checklists_cam_no ON engineering_dfm_checklists(cam_no);

CREATE TRIGGER update_dfm_checklists_updated_at
    BEFORE UPDATE ON engineering_dfm_checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE engineering_dfm_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES engineering_dfm_checklists(id) ON DELETE CASCADE,
    category VARCHAR(100),
    title VARCHAR(200),
    description TEXT,
    recommended TEXT,
    status VARCHAR(20),
    comment TEXT,
    sort_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dfm_items_checklist_id ON engineering_dfm_checklist_items(checklist_id);
CREATE INDEX idx_dfm_items_category ON engineering_dfm_checklist_items(category);

CREATE TRIGGER update_dfm_items_updated_at
    BEFORE UPDATE ON engineering_dfm_checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- DFM reviews
CREATE TABLE engineering_dfm_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cam_job_id UUID REFERENCES engineering_cam_jobs(id) ON DELETE SET NULL,
    rfq_no VARCHAR(50),
    sales_order_no VARCHAR(50),
    cam_no VARCHAR(50),
    board_name VARCHAR(200),
    revision VARCHAR(20),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    reviewer VARCHAR(150),
    global_notes TEXT,
    customer_questions TEXT,
    approvals JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dfm_reviews_cam_job_id ON engineering_dfm_reviews(cam_job_id);
CREATE INDEX idx_dfm_reviews_status ON engineering_dfm_reviews(status);

CREATE TRIGGER update_dfm_reviews_updated_at
    BEFORE UPDATE ON engineering_dfm_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE engineering_dfm_review_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES engineering_dfm_reviews(id) ON DELETE CASCADE,
    category VARCHAR(100),
    item VARCHAR(200),
    result VARCHAR(20),
    severity VARCHAR(20),
    notes TEXT,
    evidence TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dfm_review_items_review_id ON engineering_dfm_review_items(review_id);
CREATE INDEX idx_dfm_review_items_category ON engineering_dfm_review_items(category);

CREATE TRIGGER update_dfm_review_items_updated_at
    BEFORE UPDATE ON engineering_dfm_review_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Panelization panels
CREATE TABLE engineering_panels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panel_name VARCHAR(200) NOT NULL,
    cam_job_id UUID REFERENCES engineering_cam_jobs(id) ON DELETE SET NULL,
    template_id UUID REFERENCES engineering_panel_templates(id) ON DELETE SET NULL,
    created_by VARCHAR(150),
    panel_size JSONB NOT NULL DEFAULT '{}'::jsonb,
    board_size JSONB NOT NULL DEFAULT '{}'::jsonb,
    array_rows INTEGER,
    array_cols INTEGER,
    separation_type VARCHAR(50),
    utilization DECIMAL(6,2),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_panels_rows CHECK (array_rows IS NULL OR array_rows >= 1),
    CONSTRAINT chk_panels_cols CHECK (array_cols IS NULL OR array_cols >= 1),
    CONSTRAINT chk_panels_utilization CHECK (utilization IS NULL OR utilization >= 0)
);

CREATE INDEX idx_panels_cam_job_id ON engineering_panels(cam_job_id);
CREATE INDEX idx_panels_status ON engineering_panels(status);

CREATE TRIGGER update_panels_updated_at
    BEFORE UPDATE ON engineering_panels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
