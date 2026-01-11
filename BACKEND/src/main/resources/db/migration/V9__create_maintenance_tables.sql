-- Maintenance Module Database Migration
-- Creates all tables for the Maintenance module including Equipment, Breakdowns, PM Schedules, and Spares Management
-- Version: V9
-- Date: 2025-01-11

-- Create maintenance_equipment table
CREATE TABLE IF NOT EXISTS maintenance_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    equipment_type VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    manufacturer_part_number VARCHAR(100),
    location VARCHAR(200),
    department VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'OPERATIONAL',
    acquisition_date DATE,
    warranty_expiry_date DATE,
    installation_date DATE,
    last_service_date DATE,
    next_service_date DATE,
    service_interval_days INTEGER,
    service_interval_hours INTEGER,
    total_operating_hours DECIMAL(10,2) DEFAULT 0.00,
    total_cycles INTEGER DEFAULT 0,
    criticality VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    is_active BOOLEAN NOT NULL DEFAULT true,
    supervisor_id UUID,
    supervisor_name VARCHAR(200),
    maintenance_group VARCHAR(100),
    cost_center VARCHAR(100),
    asset_value DECIMAL(15,2),
    depreciation_rate DECIMAL(5,2),
    barcode VARCHAR(100),
    qr_code VARCHAR(200),
    specifications JSONB,
    documentation_links TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create maintenance_breakdowns table
CREATE TABLE IF NOT EXISTS maintenance_breakdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breakdown_number VARCHAR(100) NOT NULL UNIQUE,
    equipment_id UUID NOT NULL REFERENCES maintenance_equipment(id),
    equipment_code VARCHAR(50) NOT NULL,
    equipment_name VARCHAR(200) NOT NULL,
    breakdown_type VARCHAR(50) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'REPORTED',
    reported_by VARCHAR(200) NOT NULL,
    reported_at TIMESTAMP WITH TIME ZONE NOT NULL,
    detected_by VARCHAR(200),
    detected_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by VARCHAR(200),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    started_by VARCHAR(200),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_by VARCHAR(200),
    completed_at TIMESTAMP WITH TIME ZONE,
    downtime_start TIMESTAMP WITH TIME ZONE,
    downtime_end TIMESTAMP WITH TIME ZONE,
    downtime_minutes DECIMAL(10,2) DEFAULT 0.00,
    failure_mode VARCHAR(200),
    failure_description TEXT,
    root_cause VARCHAR(200),
    root_cause_description TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    affected_products TEXT,
    affected_quantity INTEGER,
    estimated_cost DECIMAL(15,2) DEFAULT 0.00,
    actual_cost DECIMAL(15,2) DEFAULT 0.00,
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    is_safety_issue BOOLEAN NOT NULL DEFAULT false,
    is_environmental_issue BOOLEAN NOT NULL DEFAULT false,
    is_quality_issue BOOLEAN NOT NULL DEFAULT false,
    production_impact VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create maintenance_pm_schedules table
CREATE TABLE IF NOT EXISTS maintenance_pm_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_code VARCHAR(100) NOT NULL UNIQUE,
    equipment_id UUID NOT NULL REFERENCES maintenance_equipment(id),
    equipment_code VARCHAR(50) NOT NULL,
    equipment_name VARCHAR(200) NOT NULL,
    pm_type VARCHAR(50) NOT NULL,
    description VARCHAR(500) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    frequency_value INTEGER NOT NULL,
    frequency_unit VARCHAR(20) NOT NULL,
    duration_hours DECIMAL(5,2) NOT NULL,
    labor_hours DECIMAL(5,2) NOT NULL,
    skill_required VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    start_date DATE NOT NULL,
    end_date DATE,
    last_performed_date DATE,
    next_due_date DATE NOT NULL,
    last_performed_by VARCHAR(200),
    last_performed_hours DECIMAL(10,2),
    created_by VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create maintenance_pm_tasks table
CREATE TABLE IF NOT EXISTS maintenance_pm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pm_schedule_id UUID NOT NULL REFERENCES maintenance_pm_schedules(id) ON DELETE CASCADE,
    task_sequence INTEGER NOT NULL,
    task_description VARCHAR(500) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    estimated_time_minutes INTEGER NOT NULL,
    required_tools TEXT,
    required_spare_parts TEXT,
    inspection_points TEXT,
    acceptance_criteria TEXT,
    safety_requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create maintenance_pm_performances table
CREATE TABLE IF NOT EXISTS maintenance_pm_performances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pm_schedule_id UUID NOT NULL REFERENCES maintenance_pm_schedules(id),
    schedule_code VARCHAR(100) NOT NULL,
    equipment_id UUID NOT NULL,
    equipment_code VARCHAR(50) NOT NULL,
    performed_date DATE NOT NULL,
    performed_by VARCHAR(200) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes DECIMAL(10,2),
    labor_hours DECIMAL(5,2),
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    findings TEXT,
    issues_found TEXT,
    recommendations TEXT,
    parts_replaced TEXT,
    parts_consumed TEXT,
    next_due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create maintenance_spares table
CREATE TABLE IF NOT EXISTS maintenance_spares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spare_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    unit_of_measure VARCHAR(20),
    manufacturer VARCHAR(100),
    manufacturer_part_number VARCHAR(100),
    equipment_compatibility TEXT,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    unit_cost DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    lead_time_days INTEGER DEFAULT 0,
    supplier_id UUID,
    supplier_name VARCHAR(200),
    supplier_part_number VARCHAR(100),
    storage_location VARCHAR(200),
    storage_bin VARCHAR(50),
    hazardous_material BOOLEAN NOT NULL DEFAULT false,
    temperature_sensitive BOOLEAN NOT NULL DEFAULT false,
    shelf_life_days INTEGER,
    warranty_period_months INTEGER,
    barcode VARCHAR(100),
    qr_code VARCHAR(200),
    specifications JSONB,
    documentation_links TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create maintenance_spare_stock table
CREATE TABLE IF NOT EXISTS maintenance_spare_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spare_id UUID NOT NULL REFERENCES maintenance_spares(id),
    spare_code VARCHAR(50) NOT NULL,
    warehouse_id UUID NOT NULL,
    warehouse_name VARCHAR(100) NOT NULL,
    location_id UUID,
    location_name VARCHAR(100),
    bin_location VARCHAR(50),
    quantity_on_hand DECIMAL(15,3) NOT NULL DEFAULT 0.000,
    quantity_reserved DECIMAL(15,3) DEFAULT 0.000,
    quantity_available DECIMAL(15,3) NOT NULL DEFAULT 0.000,
    last_movement_date TIMESTAMP WITH TIME ZONE,
    cost_per_unit DECIMAL(15,2),
    total_value DECIMAL(15,2),
    lot_number VARCHAR(100),
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create maintenance_spare_movements table
CREATE TABLE IF NOT EXISTS maintenance_spare_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_number VARCHAR(100) NOT NULL UNIQUE,
    spare_id UUID NOT NULL REFERENCES maintenance_spares(id),
    spare_code VARCHAR(50) NOT NULL,
    movement_type VARCHAR(50) NOT NULL,
    quantity DECIMAL(15,3) NOT NULL,
    unit_cost DECIMAL(15,2),
    total_cost DECIMAL(15,2),
    from_warehouse_id UUID,
    from_warehouse_name VARCHAR(100),
    from_location_id UUID,
    from_location_name VARCHAR(100),
    to_warehouse_id UUID,
    to_warehouse_name VARCHAR(100),
    to_location_id UUID,
    to_location_name VARCHAR(100),
    reference_document VARCHAR(200),
    reference_id UUID,
    performed_by VARCHAR(200) NOT NULL,
    approved_by VARCHAR(200),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create maintenance_work_orders table
CREATE TABLE IF NOT EXISTS maintenance_work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_number VARCHAR(100) NOT NULL UNIQUE,
    equipment_id UUID NOT NULL REFERENCES maintenance_equipment(id),
    equipment_code VARCHAR(50) NOT NULL,
    equipment_name VARCHAR(200) NOT NULL,
    breakdown_id UUID REFERENCES maintenance_breakdowns(id),
    pm_schedule_id UUID REFERENCES maintenance_pm_schedules(id),
    work_order_type VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    description VARCHAR(500) NOT NULL,
    requested_by VARCHAR(200) NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL,
    assigned_to VARCHAR(200),
    assigned_at TIMESTAMP WITH TIME ZONE,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2),
    labor_cost DECIMAL(15,2) DEFAULT 0.00,
    material_cost DECIMAL(15,2) DEFAULT 0.00,
    total_cost DECIMAL(15,2) DEFAULT 0.00,
    completion_notes TEXT,
    quality_notes TEXT,
    safety_notes TEXT,
    created_by VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create maintenance_work_order_tasks table
CREATE TABLE IF NOT EXISTS maintenance_work_order_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES maintenance_work_orders(id) ON DELETE CASCADE,
    task_sequence INTEGER NOT NULL,
    task_description VARCHAR(500) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    assigned_to VARCHAR(200),
    estimated_time_hours DECIMAL(5,2),
    actual_time_hours DECIMAL(5,2),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create maintenance_work_order_parts table
CREATE TABLE IF NOT EXISTS maintenance_work_order_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES maintenance_work_orders(id) ON DELETE CASCADE,
    spare_id UUID NOT NULL REFERENCES maintenance_spares(id),
    spare_code VARCHAR(50) NOT NULL,
    spare_description VARCHAR(200) NOT NULL,
    quantity_used DECIMAL(15,3) NOT NULL,
    unit_cost DECIMAL(15,2),
    total_cost DECIMAL(15,2),
    warehouse_id UUID NOT NULL,
    warehouse_name VARCHAR(100) NOT NULL,
    location_id UUID,
    location_name VARCHAR(100),
    issued_by VARCHAR(200),
    issued_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization

-- Equipment indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_code ON maintenance_equipment(equipment_code);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_type ON maintenance_equipment(equipment_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_status ON maintenance_equipment(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_location ON maintenance_equipment(location);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_department ON maintenance_equipment(department);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_criticality ON maintenance_equipment(criticality);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_active ON maintenance_equipment(is_active);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_next_service ON maintenance_equipment(next_service_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_created_at ON maintenance_equipment(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_updated_at ON maintenance_equipment(updated_at);

-- Breakdowns indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_breakdowns_number ON maintenance_breakdowns(breakdown_number);
CREATE INDEX IF NOT EXISTS idx_maintenance_breakdowns_equipment_id ON maintenance_breakdowns(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_breakdowns_type ON maintenance_breakdowns(breakdown_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_breakdowns_severity ON maintenance_breakdowns(severity);
CREATE INDEX IF NOT EXISTS idx_maintenance_breakdowns_status ON maintenance_breakdowns(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_breakdowns_priority ON maintenance_breakdowns(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_breakdowns_reported_at ON maintenance_breakdowns(reported_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_breakdowns_completed_at ON maintenance_breakdowns(completed_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_breakdowns_downtime ON maintenance_breakdowns(downtime_minutes);
CREATE INDEX IF NOT EXISTS idx_maintenance_breakdowns_created_at ON maintenance_breakdowns(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_breakdowns_updated_at ON maintenance_breakdowns(updated_at);

-- PM Schedules indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_schedules_code ON maintenance_pm_schedules(schedule_code);
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_schedules_equipment_id ON maintenance_pm_schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_schedules_type ON maintenance_pm_schedules(pm_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_schedules_status ON maintenance_pm_schedules(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_schedules_next_due ON maintenance_pm_schedules(next_due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_schedules_created_at ON maintenance_pm_schedules(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_schedules_updated_at ON maintenance_pm_schedules(updated_at);

-- PM Tasks indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_tasks_schedule_id ON maintenance_pm_tasks(pm_schedule_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_tasks_sequence ON maintenance_pm_tasks(task_sequence);
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_tasks_type ON maintenance_pm_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_tasks_created_at ON maintenance_pm_tasks(created_at);

-- PM Performances indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_performances_schedule_id ON maintenance_pm_performances(pm_schedule_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_performances_equipment_id ON maintenance_pm_performances(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_performances_performed_date ON maintenance_pm_performances(performed_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_performances_performed_by ON maintenance_pm_performances(performed_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_performances_status ON maintenance_pm_performances(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_pm_performances_created_at ON maintenance_pm_performances(created_at);

-- Spares indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_spares_code ON maintenance_spares(spare_code);
CREATE INDEX IF NOT EXISTS idx_maintenance_spares_name ON maintenance_spares(name);
CREATE INDEX IF NOT EXISTS idx_maintenance_spares_category ON maintenance_spares(category);
CREATE INDEX IF NOT EXISTS idx_maintenance_spares_equipment_compatibility ON maintenance_spares (equipment_compatibility);
CREATE INDEX IF NOT EXISTS idx_maintenance_spares_active ON maintenance_spares(is_active);
CREATE INDEX IF NOT EXISTS idx_maintenance_spares_created_at ON maintenance_spares(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_spares_updated_at ON maintenance_spares(updated_at);

-- Spare Stock indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_spare_stock_spare_id ON maintenance_spare_stock(spare_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_spare_stock_warehouse_id ON maintenance_spare_stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_spare_stock_location_id ON maintenance_spare_stock(location_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_spare_stock_available ON maintenance_spare_stock(quantity_available);
CREATE INDEX IF NOT EXISTS idx_maintenance_spare_stock_created_at ON maintenance_spare_stock(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_spare_stock_updated_at ON maintenance_spare_stock(updated_at);

-- Spare Movements indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_spare_movements_number ON maintenance_spare_movements(movement_number);
CREATE INDEX IF NOT EXISTS idx_maintenance_spare_movements_spare_id ON maintenance_spare_movements(spare_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_spare_movements_type ON maintenance_spare_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_spare_movements_performed_by ON maintenance_spare_movements(performed_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_spare_movements_created_at ON maintenance_spare_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_spare_movements_updated_at ON maintenance_spare_movements(updated_at);

-- Work Orders indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_work_orders_number ON maintenance_work_orders(work_order_number);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_orders_equipment_id ON maintenance_work_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_orders_breakdown_id ON maintenance_work_orders(breakdown_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_orders_pm_schedule_id ON maintenance_work_orders(pm_schedule_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_orders_type ON maintenance_work_orders(work_order_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_orders_status ON maintenance_work_orders(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_orders_priority ON maintenance_work_orders(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_orders_requested_at ON maintenance_work_orders(requested_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_orders_actual_end ON maintenance_work_orders(actual_end);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_orders_created_at ON maintenance_work_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_orders_updated_at ON maintenance_work_orders(updated_at);

-- Work Order Tasks indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_work_order_tasks_work_order_id ON maintenance_work_order_tasks(work_order_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_order_tasks_sequence ON maintenance_work_order_tasks(task_sequence);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_order_tasks_type ON maintenance_work_order_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_order_tasks_status ON maintenance_work_order_tasks(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_order_tasks_created_at ON maintenance_work_order_tasks(created_at);

-- Work Order Parts indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_work_order_parts_work_order_id ON maintenance_work_order_parts(work_order_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_order_parts_spare_id ON maintenance_work_order_parts(spare_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_order_parts_warehouse_id ON maintenance_work_order_parts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_order_parts_created_at ON maintenance_work_order_parts(created_at);

-- Create check constraints for enum values

-- Equipment constraints
ALTER TABLE maintenance_equipment 
    ADD CONSTRAINT chk_equipment_status 
    CHECK (status IN ('OPERATIONAL', 'MAINTENANCE', 'BREAKDOWN', 'IDLE', 'RETIRED', 'DISPOSED'));

ALTER TABLE maintenance_equipment 
    ADD CONSTRAINT chk_equipment_criticality 
    CHECK (criticality IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));

-- Breakdowns constraints
ALTER TABLE maintenance_breakdowns 
    ADD CONSTRAINT chk_breakdowns_type 
    CHECK (breakdown_type IN ('MECHANICAL', 'ELECTRICAL', 'HYDRAULIC', 'PNEUMATIC', 'CONTROL', 'SOFTWARE', 'OTHER'));

ALTER TABLE maintenance_breakdowns 
    ADD CONSTRAINT chk_breakdowns_severity 
    CHECK (severity IN ('MINOR', 'MODERATE', 'SEVERE', 'CRITICAL'));

ALTER TABLE maintenance_breakdowns 
    ADD CONSTRAINT chk_breakdowns_status 
    CHECK (status IN ('REPORTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

ALTER TABLE maintenance_breakdowns 
    ADD CONSTRAINT chk_breakdowns_priority 
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'));

-- PM Schedules constraints
ALTER TABLE maintenance_pm_schedules 
    ADD CONSTRAINT chk_pm_schedules_type 
    CHECK (pm_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'CUSTOM'));

ALTER TABLE maintenance_pm_schedules 
    ADD CONSTRAINT chk_pm_schedules_frequency 
    CHECK (frequency IN ('TIME_BASED', 'RUN_HOURS', 'CYCLES'));

ALTER TABLE maintenance_pm_schedules 
    ADD CONSTRAINT chk_pm_schedules_unit 
    CHECK (frequency_unit IN ('DAYS', 'WEEKS', 'MONTHS', 'YEARS', 'HOURS', 'CYCLES'));

ALTER TABLE maintenance_pm_schedules 
    ADD CONSTRAINT chk_pm_schedules_status 
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'COMPLETED'));

-- PM Tasks constraints
ALTER TABLE maintenance_pm_tasks 
    ADD CONSTRAINT chk_pm_tasks_type 
    CHECK (task_type IN ('INSPECTION', 'LUBRICATION', 'CLEANING', 'ADJUSTMENT', 'REPLACEMENT', 'CALIBRATION', 'TESTING'));

-- PM Performances constraints
ALTER TABLE maintenance_pm_performances 
    ADD CONSTRAINT chk_pm_performances_status 
    CHECK (status IN ('COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED'));

-- Spares constraints
ALTER TABLE maintenance_spares 
    ADD CONSTRAINT chk_spares_category 
    CHECK (category IN ('MECHANICAL', 'ELECTRICAL', 'HYDRAULIC', 'PNEUMATIC', 'INSTRUMENTATION', 'TOOLS', 'CONSUMABLES', 'OTHER'));

-- Work Orders constraints
ALTER TABLE maintenance_work_orders 
    ADD CONSTRAINT chk_work_orders_type 
    CHECK (work_order_type IN ('BREAKDOWN', 'PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'IMPROVEMENT'));

ALTER TABLE maintenance_work_orders 
    ADD CONSTRAINT chk_work_orders_status 
    CHECK (status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'));

ALTER TABLE maintenance_work_orders 
    ADD CONSTRAINT chk_work_orders_priority 
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'));

-- Work Order Tasks constraints
ALTER TABLE maintenance_work_order_tasks 
    ADD CONSTRAINT chk_work_order_tasks_type 
    CHECK (task_type IN ('DIAGNOSIS', 'REPAIR', 'REPLACEMENT', 'ADJUSTMENT', 'CALIBRATION', 'TESTING', 'CLEANING'));

ALTER TABLE maintenance_work_order_tasks 
    ADD CONSTRAINT chk_work_order_tasks_status 
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_maintenance_equipment_updated_at ON maintenance_equipment;
CREATE TRIGGER update_maintenance_equipment_updated_at 
    BEFORE UPDATE ON maintenance_equipment 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_breakdowns_updated_at ON maintenance_breakdowns;
CREATE TRIGGER update_maintenance_breakdowns_updated_at 
    BEFORE UPDATE ON maintenance_breakdowns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_pm_schedules_updated_at ON maintenance_pm_schedules;
CREATE TRIGGER update_maintenance_pm_schedules_updated_at 
    BEFORE UPDATE ON maintenance_pm_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_pm_tasks_updated_at ON maintenance_pm_tasks;
CREATE TRIGGER update_maintenance_pm_tasks_updated_at 
    BEFORE UPDATE ON maintenance_pm_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_pm_performances_updated_at ON maintenance_pm_performances;
CREATE TRIGGER update_maintenance_pm_performances_updated_at 
    BEFORE UPDATE ON maintenance_pm_performances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_spares_updated_at ON maintenance_spares;
CREATE TRIGGER update_maintenance_spares_updated_at 
    BEFORE UPDATE ON maintenance_spares 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_spare_stock_updated_at ON maintenance_spare_stock;
CREATE TRIGGER update_maintenance_spare_stock_updated_at 
    BEFORE UPDATE ON maintenance_spare_stock 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_spare_movements_updated_at ON maintenance_spare_movements;
CREATE TRIGGER update_maintenance_spare_movements_updated_at 
    BEFORE UPDATE ON maintenance_spare_movements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_work_orders_updated_at ON maintenance_work_orders;
CREATE TRIGGER update_maintenance_work_orders_updated_at 
    BEFORE UPDATE ON maintenance_work_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_work_order_tasks_updated_at ON maintenance_work_order_tasks;
CREATE TRIGGER update_maintenance_work_order_tasks_updated_at 
    BEFORE UPDATE ON maintenance_work_order_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_work_order_parts_updated_at ON maintenance_work_order_parts;
CREATE TRIGGER update_maintenance_work_order_parts_updated_at 
    BEFORE UPDATE ON maintenance_work_order_parts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing

-- Sample Equipment
INSERT INTO maintenance_equipment (
    equipment_code, name, description, equipment_type, model, serial_number, manufacturer, location, department, status, acquisition_date, warranty_expiry_date, service_interval_days, criticality, supervisor_name, maintenance_group, asset_value
) VALUES 
('EQ-001', 'CNC Drill Machine', 'High-precision drilling machine for PCB manufacturing', 'CNC_DRILL', 'Model-X1000', 'SN-DRILL-001', 'Precision Tools Inc.', 'Production Floor A', 'Manufacturing', 'OPERATIONAL', '2024-01-15', '2026-01-15', 30, 'CRITICAL', 'John Smith', 'Machine Shop', 50000.00),
('EQ-002', 'Solder Paste Printer', 'Automated solder paste application system', 'SOLDER_PRINTER', 'SP-2000', 'SN-SP-002', 'SMT Solutions', 'Production Floor B', 'Manufacturing', 'OPERATIONAL', '2023-06-20', '2025-06-20', 14, 'HIGH', 'Jane Doe', 'SMT Line', 25000.00),
('EQ-003', 'Reflow Oven', '8-zone reflow soldering oven', 'REFLOW_OVEN', 'RO-8Z', 'SN-RO-003', 'Thermal Systems', 'Production Floor C', 'Manufacturing', 'MAINTENANCE', '2022-12-10', '2024-12-10', 90, 'HIGH', 'Bob Johnson', 'SMT Line', 35000.00),
('EQ-004', 'AOI System', 'Automated Optical Inspection machine', 'AOI', 'VisionPro-500', 'SN-AOI-004', 'Inspection Tech', 'Quality Control', 'Quality', 'OPERATIONAL', '2024-03-05', '2026-03-05', 60, 'MEDIUM', 'Alice Brown', 'Quality Control', 40000.00),
('EQ-005', 'Wave Solder Machine', 'Selective wave soldering system', 'WAVE_SOLDER', 'WS-300', 'SN-WS-005', 'Solder Masters', 'Production Floor D', 'Manufacturing', 'OPERATIONAL', '2023-09-12', '2025-09-12', 45, 'MEDIUM', 'Charlie Wilson', 'Through-hole', 30000.00);

-- Sample PM Schedules
INSERT INTO maintenance_pm_schedules (
    schedule_code, equipment_id, equipment_code, equipment_name, pm_type, description, frequency, frequency_value, frequency_unit, duration_hours, labor_hours, skill_required, status, start_date, next_due_date, created_by
) VALUES 
('PM-DRILL-001', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-001'), 'EQ-001', 'CNC Drill Machine', 'DAILY', 'Daily inspection and cleaning', 'TIME_BASED', 1, 'DAYS', 0.5, 0.5, 'Machine Operator', 'ACTIVE', '2025-01-01', '2025-01-12', 'Maintenance Supervisor'),
('PM-DRILL-002', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-001'), 'EQ-001', 'CNC Drill Machine', 'WEEKLY', 'Weekly lubrication and calibration', 'TIME_BASED', 1, 'WEEKS', 2.0, 2.0, 'Maintenance Technician', 'ACTIVE', '2025-01-01', '2025-01-19', 'Maintenance Supervisor'),
('PM-DRILL-003', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-001'), 'EQ-001', 'CNC Drill Machine', 'MONTHLY', 'Monthly comprehensive inspection', 'TIME_BASED', 1, 'MONTHS', 8.0, 8.0, 'Senior Technician', 'ACTIVE', '2025-01-01', '2025-02-01', 'Maintenance Supervisor'),
('PM-SP-001', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-002'), 'EQ-002', 'Solder Paste Printer', 'DAILY', 'Daily cleaning and alignment check', 'TIME_BASED', 1, 'DAYS', 0.5, 0.5, 'Machine Operator', 'ACTIVE', '2025-01-01', '2025-01-12', 'Maintenance Supervisor'),
('PM-SP-002', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-002'), 'EQ-002', 'Solder Paste Printer', 'WEEKLY', 'Weekly maintenance and calibration', 'TIME_BASED', 1, 'WEEKS', 1.5, 1.5, 'Maintenance Technician', 'ACTIVE', '2025-01-01', '2025-01-19', 'Maintenance Supervisor'),
('PM-RO-001', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-003'), 'EQ-003', 'Reflow Oven', 'DAILY', 'Daily temperature profile check', 'TIME_BASED', 1, 'DAYS', 0.25, 0.25, 'Machine Operator', 'ACTIVE', '2025-01-01', '2025-01-12', 'Maintenance Supervisor'),
('PM-RO-002', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-003'), 'EQ-003', 'Reflow Oven', 'MONTHLY', 'Monthly heating element inspection', 'TIME_BASED', 1, 'MONTHS', 4.0, 4.0, 'Senior Technician', 'ACTIVE', '2025-01-01', '2025-02-01', 'Maintenance Supervisor'),
('PM-AOI-001', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-004'), 'EQ-004', 'AOI System', 'WEEKLY', 'Weekly camera calibration', 'TIME_BASED', 1, 'WEEKS', 1.0, 1.0, 'Quality Technician', 'ACTIVE', '2025-01-01', '2025-01-19', 'Maintenance Supervisor'),
('PM-WS-001', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-005'), 'EQ-005', 'Wave Solder Machine', 'DAILY', 'Daily flux management check', 'TIME_BASED', 1, 'DAYS', 0.5, 0.5, 'Machine Operator', 'ACTIVE', '2025-01-01', '2025-01-12', 'Maintenance Supervisor'),
('PM-WS-002', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-005'), 'EQ-005', 'Wave Solder Machine', 'MONTHLY', 'Monthly pump and nozzle inspection', 'TIME_BASED', 1, 'MONTHS', 3.0, 3.0, 'Maintenance Technician', 'ACTIVE', '2025-01-01', '2025-02-01', 'Maintenance Supervisor');

-- Sample PM Tasks
INSERT INTO maintenance_pm_tasks (
    pm_schedule_id, task_sequence, task_description, task_type, estimated_time_minutes, required_tools, required_spare_parts, inspection_points, acceptance_criteria
) VALUES 
-- Daily Drill Tasks
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-DRILL-001'), 1, 'Clean machine exterior and work area', 'CLEANING', 10, 'Lint-free cloth, cleaning solution', NULL, 'Machine surface, work table', 'No dust or debris visible'),
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-DRILL-001'), 2, 'Check oil levels and lubrication points', 'INSPECTION', 5, 'Dipstick, lubricant', NULL, 'Oil reservoir, lubrication points', 'Oil level within range, lubrication adequate'),
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-DRILL-001'), 3, 'Inspect drill bits for wear', 'INSPECTION', 10, 'Magnifying glass, micrometer', NULL, 'Drill bit tips, shanks', 'No chipping or excessive wear'),
-- Weekly Drill Tasks
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-DRILL-002'), 1, 'Lubricate all moving parts', 'LUBRICATION', 30, 'Grease gun, appropriate grease', NULL, 'Linear guides, ball screws, bearings', 'Smooth operation, no binding'),
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-DRILL-002'), 2, 'Calibrate positioning system', 'CALIBRATION', 45, 'Laser alignment tool, calibration blocks', NULL, 'X-Y table, Z-axis', 'Positioning accuracy within tolerance'),
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-DRILL-002'), 3, 'Check electrical connections', 'INSPECTION', 15, 'Multimeter, inspection mirror', NULL, 'Power connections, control wiring', 'No loose connections, proper voltage'),
-- Monthly Drill Tasks
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-DRILL-003'), 1, 'Complete mechanical inspection', 'INSPECTION', 240, 'Torque wrench, alignment tools', 'Worn bearings, seals', 'All mechanical components', 'No excessive play, proper torque'),
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-DRILL-003'), 2, 'Update control software if needed', 'ADJUSTMENT', 60, 'Laptop, software update files', NULL, 'Control system', 'Latest software version installed'),
-- Daily Solder Printer Tasks
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-SP-001'), 1, 'Clean stencil and squeegee', 'CLEANING', 15, 'Stencil cleaner, lint-free wipes', NULL, 'Stencil surface, squeegee edge', 'No solder paste residue'),
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-SP-001'), 2, 'Check paste viscosity', 'TESTING', 5, 'Viscometer', NULL, 'Solder paste', 'Viscosity within specification'),
-- Weekly Solder Printer Tasks
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-SP-002'), 1, 'Calibrate print parameters', 'CALIBRATION', 60, 'Calibration tools, test boards', NULL, 'Print pressure, speed, separation', 'Consistent print quality'),
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-SP-002'), 2, 'Inspect and clean vacuum system', 'CLEANING', 30, 'Compressed air, cleaning tools', NULL, 'Vacuum nozzles, filters', 'No clogs, proper vacuum level');

-- Sample Spares
INSERT INTO maintenance_spares (
    spare_code, name, description, category, unit_of_measure, manufacturer, manufacturer_part_number, equipment_compatibility, min_stock_level, max_stock_level, reorder_level, reorder_quantity, unit_cost, lead_time_days, storage_location, hazardous_material
) VALUES 
('SP-001', 'Drill Bit Set', 'High-speed steel drill bits for PCB drilling', 'MECHANICAL', 'SET', 'Precision Tools Inc.', 'DB-HSS-1.0MM', 'EQ-001', 5, 20, 8, 10, 150.00, 7, 'Tool Room A', false),
('SP-002', 'Solder Paste', 'Type 4 solder paste for SMT applications', 'CONSUMABLES', 'KG', 'Solder Masters', 'SP-T4-500G', 'EQ-002', 10, 50, 20, 25, 85.00, 3, 'Chemical Storage', true),
('SP-003', 'Heating Element', 'Reflow oven heating element assembly', 'ELECTRICAL', 'EA', 'Thermal Systems', 'HE-RO8-220V', 'EQ-003', 2, 10, 4, 5, 250.00, 14, 'Electrical Storage', false),
('SP-004', 'Camera Module', 'AOI system inspection camera', 'ELECTRICAL', 'EA', 'Inspection Tech', 'CAM-AOI-HD', 'EQ-004', 1, 5, 2, 3, 1200.00, 21, 'Electronic Storage', false),
('SP-005', 'Pump Assembly', 'Wave solder machine flux pump', 'MECHANICAL', 'EA', 'Solder Masters', 'PUMP-WS-12V', 'EQ-005', 1, 5, 2, 3, 350.00, 10, 'Mechanical Storage', false),
('SP-006', 'Lubricating Grease', 'High-temperature machine grease', 'CONSUMABLES', 'KG', 'LubriTech', 'GREASE-HT-500G', 'EQ-001,EQ-002,EQ-003,EQ-005', 5, 25, 10, 15, 45.00, 5, 'Chemical Storage', true),
('SP-007', 'Control Board', 'CNC machine control electronics', 'ELECTRICAL', 'EA', 'Control Systems', 'CB-CNC-X1', 'EQ-001', 1, 3, 1, 2, 850.00, 30, 'Electronic Storage', false),
('SP-008', 'Squeegee Blade', 'Solder paste printer squeegee', 'MECHANICAL', 'EA', 'SMT Solutions', 'SQ-SP-200MM', 'EQ-002', 10, 50, 20, 25, 25.00, 7, 'Tool Room B', false),
('SP-009', 'Thermocouple', 'Temperature sensor for reflow oven', 'ELECTRICAL', 'EA', 'Thermal Systems', 'TC-K-300C', 'EQ-003', 5, 25, 10, 15, 35.00, 10, 'Electronic Storage', false),
('SP-010', 'Air Filter', 'Compressed air filtration unit', 'MECHANICAL', 'EA', 'Air Systems', 'AF-CNC-10MIC', 'EQ-001,EQ-004', 3, 15, 6, 10, 75.00, 7, 'Mechanical Storage', false);

-- Sample Spare Stock
INSERT INTO maintenance_spare_stock (
    spare_id, spare_code, warehouse_id, warehouse_name, location_id, location_name, bin_location, quantity_on_hand, quantity_reserved, quantity_available, cost_per_unit, total_value
) VALUES 
((SELECT id FROM maintenance_spares WHERE spare_code = 'SP-001'), 'SP-001', gen_random_uuid(), 'Main Warehouse', gen_random_uuid(), 'Tool Storage', 'A-001', 12, 2, 10, 150.00, 1800.00),
((SELECT id FROM maintenance_spares WHERE spare_code = 'SP-002'), 'SP-002', gen_random_uuid(), 'Main Warehouse', gen_random_uuid(), 'Chemical Storage', 'B-002', 35, 5, 30, 85.00, 2975.00),
((SELECT id FROM maintenance_spares WHERE spare_code = 'SP-003'), 'SP-003', gen_random_uuid(), 'Main Warehouse', gen_random_uuid(), 'Electrical Storage', 'C-003', 6, 1, 5, 250.00, 1500.00),
((SELECT id FROM maintenance_spares WHERE spare_code = 'SP-004'), 'SP-004', gen_random_uuid(), 'Main Warehouse', gen_random_uuid(), 'Electronic Storage', 'D-004', 3, 0, 3, 1200.00, 3600.00),
((SELECT id FROM maintenance_spares WHERE spare_code = 'SP-005'), 'SP-005', gen_random_uuid(), 'Main Warehouse', gen_random_uuid(), 'Mechanical Storage', 'E-005', 4, 1, 3, 350.00, 1400.00),
((SELECT id FROM maintenance_spares WHERE spare_code = 'SP-006'), 'SP-006', gen_random_uuid(), 'Main Warehouse', gen_random_uuid(), 'Chemical Storage', 'B-006', 18, 3, 15, 45.00, 810.00),
((SELECT id FROM maintenance_spares WHERE spare_code = 'SP-007'), 'SP-007', gen_random_uuid(), 'Main Warehouse', gen_random_uuid(), 'Electronic Storage', 'D-007', 2, 0, 2, 850.00, 1700.00),
((SELECT id FROM maintenance_spares WHERE spare_code = 'SP-008'), 'SP-008', gen_random_uuid(), 'Main Warehouse', gen_random_uuid(), 'Tool Room B', 'F-008', 32, 4, 28, 25.00, 800.00),
((SELECT id FROM maintenance_spares WHERE spare_code = 'SP-009'), 'SP-009', gen_random_uuid(), 'Main Warehouse', gen_random_uuid(), 'Electronic Storage', 'D-009', 15, 2, 13, 35.00, 525.00),
((SELECT id FROM maintenance_spares WHERE spare_code = 'SP-010'), 'SP-010', gen_random_uuid(), 'Main Warehouse', gen_random_uuid(), 'Mechanical Storage', 'E-010', 12, 1, 11, 75.00, 900.00);

-- Sample Breakdowns
INSERT INTO maintenance_breakdowns (
    breakdown_number, equipment_id, equipment_code, equipment_name, breakdown_type, severity, status, reported_by, reported_at, detected_by, detected_at, failure_mode, failure_description, root_cause, corrective_action, estimated_cost, priority, is_safety_issue, production_impact
) VALUES 
('BD-001-2025', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-001'), 'EQ-001', 'CNC Drill Machine', 'MECHANICAL', 'SEVERE', 'COMPLETED', 'John Smith', '2025-01-05 14:30:00+00', 'John Smith', '2025-01-05 14:30:00+00', 'Spindle Bearing Failure', 'Spindle making loud grinding noise and overheating', 'Bearing wear due to inadequate lubrication', 'Replaced spindle bearing assembly and updated lubrication schedule', 1200.00, 'HIGH', false, 'Production halted for 4 hours'),
('BD-002-2025', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-002'), 'EQ-002', 'Solder Paste Printer', 'ELECTRICAL', 'MODERATE', 'IN_PROGRESS', 'Jane Doe', '2025-01-08 09:15:00+00', 'Jane Doe', '2025-01-08 09:15:00+00', 'Control Board Malfunction', 'Printer not responding to commands', 'Power surge damage to control electronics', 'Replacing control board and installing surge protector', 850.00, 'MEDIUM', false, 'Reduced throughput by 50%'),
('BD-003-2025', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-003'), 'EQ-003', 'Reflow Oven', 'CONTROL', 'MINOR', 'COMPLETED', 'Bob Johnson', '2025-01-10 06:45:00+00', 'Bob Johnson', '2025-01-10 06:45:00+00', 'Temperature Sensor Drift', 'Oven not maintaining set temperature profile', 'Thermocouple calibration drift', 'Replaced thermocouple and recalibrated temperature control', 150.00, 'LOW', false, 'Minor quality variation'),
('BD-004-2025', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-004'), 'EQ-004', 'AOI System', 'SOFTWARE', 'SEVERE', 'REPORTED', 'Alice Brown', '2025-01-11 10:20:00+00', 'Alice Brown', '2025-01-11 10:20:00+00', 'Image Processing Error', 'System failing to process inspection images', 'Software bug in image processing algorithm', 'Contacting vendor for software patch', 0.00, 'HIGH', false, 'Quality inspection completely stopped'),
('BD-005-2025', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-005'), 'EQ-005', 'Wave Solder Machine', 'HYDRAULIC', 'CRITICAL', 'IN_PROGRESS', 'Charlie Wilson', '2025-01-11 15:45:00+00', 'Charlie Wilson', '2025-01-11 15:45:00+00', 'Pump Failure', 'Flux pump not delivering proper flow rate', 'Pump seal failure causing air ingress', 'Replacing pump assembly and checking entire hydraulic system', 500.00, 'URGENT', false, 'Complete production line shutdown');

-- Sample PM Performances
INSERT INTO maintenance_pm_performances (
    pm_schedule_id, schedule_code, equipment_id, equipment_code, performed_date, performed_by, start_time, end_time, duration_minutes, labor_hours, status, findings, recommendations, next_due_date
) VALUES 
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-DRILL-001'), 'PM-DRILL-001', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-001'), 'EQ-001', '2025-01-10', 'John Smith', '2025-01-10 06:00:00+00', '2025-01-10 06:15:00+00', 15, 0.25, 'COMPLETED', 'All checks passed, machine operating normally', 'Continue with current maintenance schedule', '2025-01-11'),
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-DRILL-002'), 'PM-DRILL-002', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-001'), 'EQ-001', '2025-01-06', 'Jane Doe', '2025-01-06 14:00:00+00', '2025-01-06 16:00:00+00', 120, 2.0, 'COMPLETED', 'Minor alignment issue corrected during calibration', 'Monitor alignment over next week', '2025-01-13'),
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-SP-001'), 'PM-SP-001', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-002'), 'EQ-002', '2025-01-10', 'Bob Johnson', '2025-01-10 07:00:00+00', '2025-01-10 07:15:00+00', 15, 0.25, 'COMPLETED', 'Stencil clean, paste viscosity good', 'None', '2025-01-11'),
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-RO-001'), 'PM-RO-001', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-003'), 'EQ-003', '2025-01-10', 'Alice Brown', '2025-01-10 08:00:00+00', '2025-01-10 08:15:00+00', 15, 0.25, 'COMPLETED', 'Temperature profile within specification', 'Schedule monthly inspection', '2025-01-11'),
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-AOI-001'), 'PM-AOI-001', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-004'), 'EQ-004', '2025-01-06', 'Charlie Wilson', '2025-01-06 09:00:00+00', '2025-01-06 10:00:00+00', 60, 1.0, 'COMPLETED', 'Camera calibration successful', 'Monitor image quality daily', '2025-01-13'),
((SELECT id FROM maintenance_pm_schedules WHERE schedule_code = 'PM-WS-001'), 'PM-WS-001', (SELECT id FROM maintenance_equipment WHERE equipment_code = 'EQ-005'), 'EQ-005', '2025-01-10', 'John Smith', '2025-01-10 10:00:00+00', '2025-01-10 10:30:00+00', 30, 0.5, 'COMPLETED', 'Flux levels normal, no leaks detected', 'Check pump seals during next monthly inspection', '2025-01-11');

-- Add comments for documentation
COMMENT ON TABLE maintenance_equipment IS 'Master data for all maintenance equipment and assets';
COMMENT ON TABLE maintenance_breakdowns IS 'Breakdown and failure tracking for equipment';
COMMENT ON TABLE maintenance_pm_schedules IS 'Preventive maintenance schedules and plans';
COMMENT ON TABLE maintenance_pm_tasks IS 'Individual tasks within PM schedules';
COMMENT ON TABLE maintenance_pm_performances IS 'PM execution history and results';
COMMENT ON TABLE maintenance_spares IS 'Spare parts and consumables catalog';
COMMENT ON TABLE maintenance_spare_stock IS 'Spare parts inventory and stock levels';
COMMENT ON TABLE maintenance_spare_movements IS 'Spare parts movement and transaction history';
COMMENT ON TABLE maintenance_work_orders IS 'Maintenance work orders and requests';
COMMENT ON TABLE maintenance_work_order_tasks IS 'Tasks within maintenance work orders';
COMMENT ON TABLE maintenance_work_order_parts IS 'Parts used in maintenance work orders';

COMMENT ON COLUMN maintenance_equipment.equipment_code IS 'Unique identifier for the equipment';
COMMENT ON COLUMN maintenance_breakdowns.breakdown_number IS 'Unique identifier for the breakdown record';
COMMENT ON COLUMN maintenance_pm_schedules.schedule_code IS 'Unique identifier for the PM schedule';
COMMENT ON COLUMN maintenance_spares.spare_code IS 'Unique identifier for the spare part';
COMMENT ON COLUMN maintenance_work_orders.work_order_number IS 'Unique identifier for the maintenance work order';

-- Log migration completion
INSERT INTO user_audit_log (user_id, action, resource_type, resource_id, request_data, response_data, created_at) 
VALUES (
    (SELECT id FROM users WHERE username = 'admin'), 
    'MIGRATION', 
    'DATABASE', 
    'V9__create_maintenance_tables.sql', 
    '{"tables": ["maintenance_equipment", "maintenance_breakdowns", "maintenance_pm_schedules", "maintenance_pm_tasks", "maintenance_pm_performances", "maintenance_spares", "maintenance_spare_stock", "maintenance_spare_movements", "maintenance_work_orders", "maintenance_work_order_tasks", "maintenance_work_order_parts"]}', 
    '{"status": "COMPLETED", "records_inserted": 50}', 
    NOW()
);

-- Display completion message
SELECT 'Maintenance module tables created successfully with sample data' AS migration_status;