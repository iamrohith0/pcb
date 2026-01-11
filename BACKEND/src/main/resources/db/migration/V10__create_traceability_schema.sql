-- Traceability Module Database Schema
-- Creates tables for batch tracking, lot genealogy, and product recalls
-- Assumes update_updated_at_column() function is available from earlier migrations

-- Traceability Batches table
-- Tracks batches of items for traceability purposes
CREATE TABLE traceability_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number VARCHAR(100) NOT NULL UNIQUE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    production_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE,
    quantity INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    location VARCHAR(200),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    lot_number VARCHAR(100),
    serial_start VARCHAR(100),
    serial_end VARCHAR(100),
    weight DECIMAL(10,3),
    length DECIMAL(10,3),
    width DECIMAL(10,3),
    height DECIMAL(10,3),
    volume DECIMAL(15,3),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_batches_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_batches_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED', 'ON_HOLD', 'RECALLED', 'DISPOSED')),
    CONSTRAINT chk_batches_weight CHECK (weight IS NULL OR weight >= 0),
    CONSTRAINT chk_batches_length CHECK (length IS NULL OR length >= 0),
    CONSTRAINT chk_batches_width CHECK (width IS NULL OR width >= 0),
    CONSTRAINT chk_batches_height CHECK (height IS NULL OR height >= 0),
    CONSTRAINT chk_batches_volume CHECK (volume IS NULL OR volume >= 0)
);

-- Traceability Lot Genealogy table
-- Tracks relationships between lots/components for traceability
CREATE TABLE traceability_lot_genealogy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_lot_id UUID NOT NULL,
    child_lot_id UUID NOT NULL,
    component_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    relationship_type VARCHAR(50) NOT NULL,
    quantity_used INTEGER,
    unit_of_measure VARCHAR(20),
    production_date TIMESTAMP WITH TIME ZONE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    location VARCHAR(200),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_genealogy_relationship_type CHECK (relationship_type IN ('COMPONENT_TO_ASSEMBLY', 'ASSEMBLY_TO_FINISHED_GOODS', 'RAW_MATERIAL_TO_COMPONENT', 'SUB_ASSEMBLY_TO_ASSEMBLY', 'LOT_TO_BATCH', 'BATCH_TO_LOT')),
    CONSTRAINT chk_genealogy_quantity_used CHECK (quantity_used IS NULL OR quantity_used >= 0)
);

-- Traceability Recalls table
-- Manages product recall cases and tracking
CREATE TABLE traceability_recalls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(100) NOT NULL UNIQUE,
    product_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES traceability_batches(id) ON DELETE SET NULL,
    lot_id UUID REFERENCES inventory_lots(id) ON DELETE SET NULL,
    recall_type VARCHAR(30) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'INITIATED',
    reason TEXT NOT NULL,
    description TEXT,
    affected_quantity INTEGER,
    affected_batches TEXT,
    affected_lots TEXT,
    initiated_date TIMESTAMP WITH TIME ZONE NOT NULL,
    effective_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    initiated_by VARCHAR(200),
    approved_by VARCHAR(200),
    customer_notification_required BOOLEAN NOT NULL DEFAULT FALSE,
    regulatory_notification_required BOOLEAN NOT NULL DEFAULT FALSE,
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_recalls_recall_type CHECK (recall_type IN ('VOLUNTARY', 'MANDATED', 'CUSTOMER_INITIATED', 'REGULATORY_INITIATED')),
    CONSTRAINT chk_recalls_severity CHECK (severity IN ('CLASS_I', 'CLASS_II', 'CLASS_III', 'MINOR')),
    CONSTRAINT chk_recalls_status CHECK (status IN ('INITIATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD')),
    CONSTRAINT chk_recalls_affected_quantity CHECK (affected_quantity IS NULL OR affected_quantity >= 0),
    CONSTRAINT chk_recalls_estimated_cost CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
    CONSTRAINT chk_recalls_actual_cost CHECK (actual_cost IS NULL OR actual_cost >= 0)
);

-- Indexes for performance optimization
CREATE INDEX idx_batches_batch_number ON traceability_batches(batch_number);
CREATE INDEX idx_batches_item_id ON traceability_batches(item_id);
CREATE INDEX idx_batches_status ON traceability_batches(status);
CREATE INDEX idx_batches_production_date ON traceability_batches(production_date);
CREATE INDEX idx_batches_expiry_date ON traceability_batches(expiry_date);
CREATE INDEX idx_batches_supplier_id ON traceability_batches(supplier_id);
CREATE INDEX idx_batches_lot_number ON traceability_batches(lot_number);
CREATE INDEX idx_batches_created_at ON traceability_batches(created_at);
CREATE INDEX idx_batches_updated_at ON traceability_batches(updated_at);

CREATE INDEX idx_genealogy_parent_lot ON traceability_lot_genealogy(parent_lot_id);
CREATE INDEX idx_genealogy_child_lot ON traceability_lot_genealogy(child_lot_id);
CREATE INDEX idx_genealogy_component_id ON traceability_lot_genealogy(component_id);
CREATE INDEX idx_genealogy_relationship_type ON traceability_lot_genealogy(relationship_type);
CREATE INDEX idx_genealogy_supplier_id ON traceability_lot_genealogy(supplier_id);
CREATE INDEX idx_genealogy_created_at ON traceability_lot_genealogy(created_at);
CREATE INDEX idx_genealogy_updated_at ON traceability_lot_genealogy(updated_at);

CREATE INDEX idx_recalls_case_number ON traceability_recalls(case_number);
CREATE INDEX idx_recalls_status ON traceability_recalls(status);
CREATE INDEX idx_recalls_product_id ON traceability_recalls(product_id);
CREATE INDEX idx_recalls_batch_id ON traceability_recalls(batch_id);
CREATE INDEX idx_recalls_lot_id ON traceability_recalls(lot_id);
CREATE INDEX idx_recalls_recall_type ON traceability_recalls(recall_type);
CREATE INDEX idx_recalls_severity ON traceability_recalls(severity);
CREATE INDEX idx_recalls_initiated_date ON traceability_recalls(initiated_date);
CREATE INDEX idx_recalls_effective_date ON traceability_recalls(effective_date);
CREATE INDEX idx_recalls_created_at ON traceability_recalls(created_at);
CREATE INDEX idx_recalls_updated_at ON traceability_recalls(updated_at);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_traceability_batches_updated_at
    BEFORE UPDATE ON traceability_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traceability_genealogy_updated_at
    BEFORE UPDATE ON traceability_lot_genealogy
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traceability_recalls_updated_at
    BEFORE UPDATE ON traceability_recalls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE traceability_batches IS 'Tracks batches of items for traceability purposes';
COMMENT ON TABLE traceability_lot_genealogy IS 'Tracks relationships between lots/components for traceability';
COMMENT ON TABLE traceability_recalls IS 'Manages product recall cases and tracking';

COMMENT ON COLUMN traceability_batches.batch_number IS 'Unique identifier for the batch';
COMMENT ON COLUMN traceability_batches.item_id IS 'Reference to the item being tracked';
COMMENT ON COLUMN traceability_batches.production_date IS 'Date when the batch was produced';
COMMENT ON COLUMN traceability_batches.expiry_date IS 'Date when the batch expires';
COMMENT ON COLUMN traceability_batches.status IS 'Current status of the batch (ACTIVE, INACTIVE, EXPIRED, ON_HOLD, RECALLED, DISPOSED)';

COMMENT ON COLUMN traceability_lot_genealogy.parent_lot_id IS 'ID of the parent lot/component';
COMMENT ON COLUMN traceability_lot_genealogy.child_lot_id IS 'ID of the child lot/component';
COMMENT ON COLUMN traceability_lot_genealogy.relationship_type IS 'Type of relationship between parent and child (COMPONENT_TO_ASSEMBLY, ASSEMBLY_TO_FINISHED_GOODS, etc.)';

COMMENT ON COLUMN traceability_recalls.case_number IS 'Unique identifier for the recall case';
COMMENT ON COLUMN traceability_recalls.recall_type IS 'Type of recall (VOLUNTARY, MANDATED, CUSTOMER_INITIATED, REGULATORY_INITIATED)';
COMMENT ON COLUMN traceability_recalls.severity IS 'Severity level of the recall (CLASS_I, CLASS_II, CLASS_III, MINOR)';
COMMENT ON COLUMN traceability_recalls.status IS 'Current status of the recall (INITIATED, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD)';