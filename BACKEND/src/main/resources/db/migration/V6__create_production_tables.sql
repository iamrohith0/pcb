-- Production Module Database Migration
-- Creates all tables for the Production module including Work Orders, Routings, Operations, WIP Events, and Machine Capacity
-- Version: V6
-- Date: 2025-01-10

-- Create production_work_orders table
CREATE TABLE IF NOT EXISTS production_work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_po VARCHAR(100),
    item_code VARCHAR(50) NOT NULL,
    item_description VARCHAR(500),
    quantity INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(20),
    routing_id UUID,
    start_date DATE,
    due_date DATE,
    completed_date DATE,
    completed_quantity INTEGER,
    scrap_quantity INTEGER,
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2),
    routing_notes TEXT,
    quality_notes TEXT,
    production_notes TEXT,
    is_rush BOOLEAN NOT NULL DEFAULT false,
    is_critical BOOLEAN NOT NULL DEFAULT false,
    customer_id UUID,
    sales_order_id UUID,
    project_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create production_routings table
CREATE TABLE IF NOT EXISTS production_routings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routing_code VARCHAR(50) NOT NULL UNIQUE,
    item_code VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    version INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    estimated_total_time DECIMAL(10,2),
    estimated_total_cost DECIMAL(15,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    revision_notes TEXT,
    engineering_notes TEXT,
    quality_requirements TEXT,
    safety_requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create production_operations table
CREATE TABLE IF NOT EXISTS production_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_code VARCHAR(50) NOT NULL,
    routing_id UUID NOT NULL,
    sequence_number INTEGER NOT NULL,
    description VARCHAR(500) NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    machine_type VARCHAR(100),
    machine_id UUID,
    estimated_time DECIMAL(10,2),
    setup_time DECIMAL(10,2),
    cycle_time DECIMAL(10,2),
    estimated_cost DECIMAL(15,2),
    labor_rate DECIMAL(10,2),
    machine_rate DECIMAL(10,2),
    is_critical BOOLEAN NOT NULL DEFAULT false,
    is_inspection BOOLEAN NOT NULL DEFAULT false,
    requires_tooling BOOLEAN NOT NULL DEFAULT false,
    tooling_code VARCHAR(100),
    setup_instructions TEXT,
    operation_instructions TEXT,
    quality_checks TEXT,
    safety_requirements TEXT,
    materials_required TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create production_wip_events table
CREATE TABLE IF NOT EXISTS production_wip_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL,
    operation_id UUID NOT NULL,
    batch_id VARCHAR(100),
    event_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    scrap_quantity INTEGER,
    rework_quantity INTEGER,
    operator_id UUID,
    operator_name VARCHAR(200),
    machine_id UUID,
    machine_name VARCHAR(200),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes DECIMAL(10,2),
    setup_time_minutes DECIMAL(10,2),
    cycle_time_minutes DECIMAL(10,2),
    yield_percentage DECIMAL(5,2),
    rework_reason VARCHAR(500),
    hold_reason VARCHAR(500),
    release_reason VARCHAR(500),
    quality_notes TEXT,
    production_notes TEXT,
    inspection_results TEXT,
    material_consumption TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create production_machine_capacity table
CREATE TABLE IF NOT EXISTS production_machine_capacity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL,
    machine_name VARCHAR(200) NOT NULL,
    machine_type VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    shift VARCHAR(50) NOT NULL,
    shift_start TIMESTAMP WITH TIME ZONE,
    shift_end TIMESTAMP WITH TIME ZONE,
    planned_hours DECIMAL(5,2),
    available_hours DECIMAL(5,2),
    utilization_percentage DECIMAL(5,2),
    status VARCHAR(50) NOT NULL,
    work_order_id UUID,
    operation_id UUID,
    assigned_quantity INTEGER,
    completed_quantity INTEGER,
    setup_time_minutes DECIMAL(10,2),
    downtime_minutes DECIMAL(10,2),
    maintenance_hours DECIMAL(5,2),
    breakdown_hours DECIMAL(5,2),
    oee_availability DECIMAL(5,2),
    oee_performance DECIMAL(5,2),
    oee_quality DECIMAL(5,2),
    oee_overall DECIMAL(5,2),
    capacity_notes TEXT,
    maintenance_notes TEXT,
    performance_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization

-- Work Orders indexes
CREATE INDEX IF NOT EXISTS idx_production_work_orders_number ON production_work_orders(work_order_number);
CREATE INDEX IF NOT EXISTS idx_production_work_orders_status ON production_work_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_work_orders_customer_po ON production_work_orders(customer_po);
CREATE INDEX IF NOT EXISTS idx_production_work_orders_item_code ON production_work_orders(item_code);
CREATE INDEX IF NOT EXISTS idx_production_work_orders_created_at ON production_work_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_production_work_orders_updated_at ON production_work_orders(updated_at);
CREATE INDEX IF NOT EXISTS idx_production_work_orders_due_date ON production_work_orders(due_date);
CREATE INDEX IF NOT EXISTS idx_production_work_orders_start_date ON production_work_orders(start_date);
CREATE INDEX IF NOT EXISTS idx_production_work_orders_routing_id ON production_work_orders(routing_id);
CREATE INDEX IF NOT EXISTS idx_production_work_orders_customer_id ON production_work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_production_work_orders_sales_order_id ON production_work_orders(sales_order_id);

-- Routings indexes
CREATE INDEX IF NOT EXISTS idx_production_routings_code ON production_routings(routing_code);
CREATE INDEX IF NOT EXISTS idx_production_routings_item_code ON production_routings(item_code);
CREATE INDEX IF NOT EXISTS idx_production_routings_status ON production_routings(status);
CREATE INDEX IF NOT EXISTS idx_production_routings_version ON production_routings(version);
CREATE INDEX IF NOT EXISTS idx_production_routings_created_at ON production_routings(created_at);
CREATE INDEX IF NOT EXISTS idx_production_routings_updated_at ON production_routings(updated_at);
CREATE INDEX IF NOT EXISTS idx_production_routings_active ON production_routings(is_active);
CREATE INDEX IF NOT EXISTS idx_production_routings_default ON production_routings(is_default);

-- Operations indexes
CREATE INDEX IF NOT EXISTS idx_production_operations_code ON production_operations(operation_code);
CREATE INDEX IF NOT EXISTS idx_production_operations_routing_id ON production_operations(routing_id);
CREATE INDEX IF NOT EXISTS idx_production_operations_sequence ON production_operations(sequence_number);
CREATE INDEX IF NOT EXISTS idx_production_operations_machine_type ON production_operations(machine_type);
CREATE INDEX IF NOT EXISTS idx_production_operations_created_at ON production_operations(created_at);
CREATE INDEX IF NOT EXISTS idx_production_operations_updated_at ON production_operations(updated_at);
CREATE INDEX IF NOT EXISTS idx_production_operations_type ON production_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_production_operations_critical ON production_operations(is_critical);
CREATE INDEX IF NOT EXISTS idx_production_operations_inspection ON production_operations(is_inspection);

-- WIP Events indexes
CREATE INDEX IF NOT EXISTS idx_production_wip_events_work_order_id ON production_wip_events(work_order_id);
CREATE INDEX IF NOT EXISTS idx_production_wip_events_operation_id ON production_wip_events(operation_id);
CREATE INDEX IF NOT EXISTS idx_production_wip_events_event_type ON production_wip_events(event_type);
CREATE INDEX IF NOT EXISTS idx_production_wip_events_status ON production_wip_events(status);
CREATE INDEX IF NOT EXISTS idx_production_wip_events_created_at ON production_wip_events(created_at);
CREATE INDEX IF NOT EXISTS idx_production_wip_events_updated_at ON production_wip_events(updated_at);
CREATE INDEX IF NOT EXISTS idx_production_wip_events_batch_id ON production_wip_events(batch_id);
CREATE INDEX IF NOT EXISTS idx_production_wip_events_machine_name ON production_wip_events(machine_name);
CREATE INDEX IF NOT EXISTS idx_production_wip_events_operator_name ON production_wip_events(operator_name);
CREATE INDEX IF NOT EXISTS idx_production_wip_events_start_time ON production_wip_events(start_time);
CREATE INDEX IF NOT EXISTS idx_production_wip_events_end_time ON production_wip_events(end_time);

-- Machine Capacity indexes
CREATE INDEX IF NOT EXISTS idx_production_machine_capacity_machine_id ON production_machine_capacity(machine_id);
CREATE INDEX IF NOT EXISTS idx_production_machine_capacity_date ON production_machine_capacity(date);
CREATE INDEX IF NOT EXISTS idx_production_machine_capacity_shift ON production_machine_capacity(shift);
CREATE INDEX IF NOT EXISTS idx_production_machine_capacity_status ON production_machine_capacity(status);
CREATE INDEX IF NOT EXISTS idx_production_machine_capacity_created_at ON production_machine_capacity(created_at);
CREATE INDEX IF NOT EXISTS idx_production_machine_capacity_updated_at ON production_machine_capacity(updated_at);
CREATE INDEX IF NOT EXISTS idx_production_machine_capacity_work_order_id ON production_machine_capacity(work_order_id);
CREATE INDEX IF NOT EXISTS idx_production_machine_capacity_operation_id ON production_machine_capacity(operation_id);

-- Create foreign key constraints
ALTER TABLE production_work_orders 
    ADD CONSTRAINT fk_work_orders_routing_id 
    FOREIGN KEY (routing_id) REFERENCES production_routings(id);

ALTER TABLE production_work_orders 
    ADD CONSTRAINT fk_work_orders_customer_id 
    FOREIGN KEY (customer_id) REFERENCES customers(id);

-- Note: sales_order_id and project_id foreign keys would reference sales_orders and projects tables
-- These are commented out as those tables may not exist yet
-- ALTER TABLE production_work_orders 
--     ADD CONSTRAINT fk_work_orders_sales_order_id 
--     FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id);

-- ALTER TABLE production_work_orders 
--     ADD CONSTRAINT fk_work_orders_project_id 
--     FOREIGN KEY (project_id) REFERENCES projects(id);

ALTER TABLE production_operations 
    ADD CONSTRAINT fk_operations_routing_id 
    FOREIGN KEY (routing_id) REFERENCES production_routings(id);

ALTER TABLE production_wip_events 
    ADD CONSTRAINT fk_wip_events_work_order_id 
    FOREIGN KEY (work_order_id) REFERENCES production_work_orders(id);

ALTER TABLE production_wip_events 
    ADD CONSTRAINT fk_wip_events_operation_id 
    FOREIGN KEY (operation_id) REFERENCES production_operations(id);

-- Note: machine_id and operator_id foreign keys would reference machines and users tables
-- These are commented out as those tables may not exist yet
-- ALTER TABLE production_wip_events 
--     ADD CONSTRAINT fk_wip_events_machine_id 
--     FOREIGN KEY (machine_id) REFERENCES machines(id);

-- ALTER TABLE production_wip_events 
--     ADD CONSTRAINT fk_wip_events_operator_id 
--     FOREIGN KEY (operator_id) REFERENCES users(id);

-- ALTER TABLE production_machine_capacity 
--     ADD CONSTRAINT fk_machine_capacity_machine_id 
--     FOREIGN KEY (machine_id) REFERENCES machines(id);

-- ALTER TABLE production_machine_capacity 
--     ADD CONSTRAINT fk_machine_capacity_work_order_id 
--     FOREIGN KEY (work_order_id) REFERENCES production_work_orders(id);

-- ALTER TABLE production_machine_capacity 
--     ADD CONSTRAINT fk_machine_capacity_operation_id 
--     FOREIGN KEY (operation_id) REFERENCES production_operations(id);

-- Create check constraints for enum values

-- Work Order constraints
ALTER TABLE production_work_orders 
    ADD CONSTRAINT chk_work_orders_status 
    CHECK (status IN ('DRAFT', 'RELEASED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'));

ALTER TABLE production_work_orders 
    ADD CONSTRAINT chk_work_orders_priority 
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'));

-- Routing constraints
ALTER TABLE production_routings 
    ADD CONSTRAINT chk_routings_status 
    CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'OBSOLETE', 'UNDER_REVIEW'));

-- Operation constraints
ALTER TABLE production_operations 
    ADD CONSTRAINT chk_operations_type 
    CHECK (operation_type IN ('PREPARATION', 'DRILLING', 'PLATING', 'IMAGING', 'ETCHING', 'SOLDERMASK', 'SILKSCREEN', 'SURFACE_FINISH', 'ROUTING', 'TESTING', 'INSPECTION', 'PACKAGING'));

-- WIP Event constraints
ALTER TABLE production_wip_events 
    ADD CONSTRAINT chk_wip_events_type 
    CHECK (event_type IN ('START', 'PAUSE', 'RESUME', 'COMPLETE', 'HOLD', 'RELEASE', 'REWORK', 'SCRAP', 'TRANSFER'));

ALTER TABLE production_wip_events 
    ADD CONSTRAINT chk_wip_events_status 
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED', 'REWORKED', 'SCRAPPED'));

-- Machine Capacity constraints
ALTER TABLE production_machine_capacity 
    ADD CONSTRAINT chk_machine_capacity_shift 
    CHECK (shift IN ('FIRST', 'SECOND', 'THIRD', 'OVERTIME'));

ALTER TABLE production_machine_capacity 
    ADD CONSTRAINT chk_machine_capacity_status 
    CHECK (status IN ('AVAILABLE', 'ASSIGNED', 'IN_USE', 'MAINTENANCE', 'BREAKDOWN', 'IDLE'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_production_work_orders_updated_at ON production_work_orders;
CREATE TRIGGER update_production_work_orders_updated_at 
    BEFORE UPDATE ON production_work_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_routings_updated_at ON production_routings;
CREATE TRIGGER update_production_routings_updated_at 
    BEFORE UPDATE ON production_routings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_operations_updated_at ON production_operations;
CREATE TRIGGER update_production_operations_updated_at 
    BEFORE UPDATE ON production_operations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_wip_events_updated_at ON production_wip_events;
CREATE TRIGGER update_production_wip_events_updated_at 
    BEFORE UPDATE ON production_wip_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_machine_capacity_updated_at ON production_machine_capacity;
CREATE TRIGGER update_production_machine_capacity_updated_at 
    BEFORE UPDATE ON production_machine_capacity 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing

-- Sample Routings
INSERT INTO production_routings (
    routing_code, item_code, description, version, status, estimated_total_time, estimated_total_cost, is_active, is_default
) VALUES 
('RT-001', 'PCB-001', 'Standard 4-layer PCB Manufacturing', 1, 'ACTIVE', 120.50, 2500.00, true, true),
('RT-002', 'PCB-002', 'High-frequency RF Board Process', 1, 'ACTIVE', 180.00, 4500.00, true, false),
('RT-003', 'PCB-003', 'Prototype Development Route', 1, 'DRAFT', 80.00, 1500.00, false, false);

-- Sample Operations for Routing RT-001
INSERT INTO production_operations (
    operation_code, routing_id, sequence_number, description, operation_type, machine_type, estimated_time, setup_time, cycle_time, estimated_cost, is_critical, is_inspection
) VALUES 
('OP-001', (SELECT id FROM production_routings WHERE routing_code = 'RT-001'), 1, 'Panel Preparation and Material Handling', 'PREPARATION', 'Material Handler', 15.00, 5.00, 10.00, 200.00, true, false),
('OP-002', (SELECT id FROM production_routings WHERE routing_code = 'RT-001'), 2, 'Drilling and Via Formation', 'DRILLING', 'CNC Drill', 25.00, 8.00, 17.00, 400.00, true, false),
('OP-003', (SELECT id FROM production_routings WHERE routing_code = 'RT-001'), 3, 'Copper Plating and Through-hole', 'PLATING', 'Plating Line', 30.00, 10.00, 20.00, 600.00, true, false),
('OP-004', (SELECT id FROM production_routings WHERE routing_code = 'RT-001'), 4, 'Imaging and Photoresist Application', 'IMAGING', 'Imaging System', 20.00, 6.00, 14.00, 350.00, true, false),
('OP-005', (SELECT id FROM production_routings WHERE routing_code = 'RT-001'), 5, 'Etching and Pattern Transfer', 'ETCHING', 'Etching Line', 25.00, 5.00, 20.00, 450.00, true, false),
('OP-006', (SELECT id FROM production_routings WHERE routing_code = 'RT-001'), 6, 'Soldermask Application', 'SOLDERMASK', 'Soldermask Printer', 15.00, 4.00, 11.00, 250.00, false, false),
('OP-007', (SELECT id FROM production_routings WHERE routing_code = 'RT-001'), 7, 'Silkscreen Legend Printing', 'SILKSCREEN', 'Silkscreen Printer', 10.00, 3.00, 7.00, 150.00, false, false),
('OP-008', (SELECT id FROM production_routings WHERE routing_code = 'RT-001'), 8, 'Surface Finish Application', 'SURFACE_FINISH', 'Surface Finish Line', 20.00, 5.00, 15.00, 300.00, true, false),
('OP-009', (SELECT id FROM production_routings WHERE routing_code = 'RT-001'), 9, 'Routing and Panel Separation', 'ROUTING', 'CNC Router', 15.00, 4.00, 11.00, 200.00, true, false),
('OP-010', (SELECT id FROM production_routings WHERE routing_code = 'RT-001'), 10, 'Electrical Testing', 'TESTING', 'Flying Probe Tester', 20.00, 2.00, 18.00, 400.00, true, true),
('OP-011', (SELECT id FROM production_routings WHERE routing_code = 'RT-001'), 11, 'Final Visual Inspection', 'INSPECTION', 'AOI System', 10.00, 1.00, 9.00, 150.00, true, true),
('OP-012', (SELECT id FROM production_routings WHERE routing_code = 'RT-001'), 12, 'Packaging and Labeling', 'PACKAGING', 'Packaging Line', 10.00, 2.00, 8.00, 100.00, false, false);

-- Sample Operations for Routing RT-002
INSERT INTO production_operations (
    operation_code, routing_id, sequence_number, description, operation_type, machine_type, estimated_time, setup_time, cycle_time, estimated_cost, is_critical, is_inspection
) VALUES 
('OP-013', (SELECT id FROM production_routings WHERE routing_code = 'RT-002'), 1, 'RF Material Preparation', 'PREPARATION', 'Material Handler', 20.00, 8.00, 12.00, 300.00, true, false),
('OP-014', (SELECT id FROM production_routings WHERE routing_code = 'RT-002'), 2, 'Precision Drilling for RF Circuits', 'DRILLING', 'High-Precision Drill', 35.00, 12.00, 23.00, 600.00, true, false),
('OP-015', (SELECT id FROM production_routings WHERE routing_code = 'RT-002'), 3, 'RF Plating Process', 'PLATING', 'RF Plating Line', 40.00, 15.00, 25.00, 800.00, true, false),
('OP-016', (SELECT id FROM production_routings WHERE routing_code = 'RT-002'), 4, 'RF Imaging with Tight Tolerances', 'IMAGING', 'RF Imaging System', 25.00, 8.00, 17.00, 500.00, true, false),
('OP-017', (SELECT id FROM production_routings WHERE routing_code = 'RT-002'), 5, 'RF Etching with Controlled Impedance', 'ETCHING', 'RF Etching Line', 30.00, 8.00, 22.00, 650.00, true, false),
('OP-018', (SELECT id FROM production_routings WHERE routing_code = 'RT-002'), 6, 'RF Soldermask Application', 'SOLDERMASK', 'RF Soldermask Printer', 20.00, 6.00, 14.00, 350.00, false, false),
('OP-019', (SELECT id FROM production_routings WHERE routing_code = 'RT-002'), 7, 'RF Surface Finish', 'SURFACE_FINISH', 'RF Surface Finish Line', 25.00, 6.00, 19.00, 450.00, true, false),
('OP-020', (SELECT id FROM production_routings WHERE routing_code = 'RT-002'), 8, 'RF Testing and Validation', 'TESTING', 'RF Test Equipment', 30.00, 5.00, 25.00, 800.00, true, true),
('OP-021', (SELECT id FROM production_routings WHERE routing_code = 'RT-002'), 9, 'RF Final Inspection', 'INSPECTION', 'RF AOI System', 15.00, 3.00, 12.00, 250.00, true, true);

-- Sample Work Orders
INSERT INTO production_work_orders (
    work_order_number, customer_po, item_code, item_description, quantity, status, priority, routing_id, start_date, due_date, is_rush, is_critical
) VALUES 
('WO-001', 'CUST-PO-001', 'PCB-001', 'Standard 4-layer PCB', 1000, 'IN_PROGRESS', 'MEDIUM', (SELECT id FROM production_routings WHERE routing_code = 'RT-001'), '2025-01-08', '2025-01-15', false, false),
('WO-002', 'CUST-PO-002', 'PCB-002', 'High-frequency RF Board', 500, 'RELEASED', 'HIGH', (SELECT id FROM production_routings WHERE routing_code = 'RT-002'), '2025-01-10', '2025-01-18', true, true),
('WO-003', 'CUST-PO-003', 'PCB-001', 'Prototype Development Board', 100, 'DRAFT', 'URGENT', (SELECT id FROM production_routings WHERE routing_code = 'RT-001'), '2025-01-12', '2025-01-14', true, false),
('WO-004', 'CUST-PO-004', 'PCB-003', 'Custom Design Board', 250, 'ON_HOLD', 'MEDIUM', (SELECT id FROM production_routings WHERE routing_code = 'RT-003'), '2025-01-15', '2025-01-22', false, false);

-- Sample WIP Events
INSERT INTO production_wip_events (
    work_order_id, operation_id, batch_id, event_type, status, quantity, scrap_quantity, rework_quantity, operator_name, machine_name, start_time, end_time, duration_minutes, yield_percentage, production_notes
) VALUES 
((SELECT id FROM production_work_orders WHERE work_order_number = 'WO-001'), (SELECT id FROM production_operations WHERE operation_code = 'OP-001'), 'BATCH-001', 'START', 'IN_PROGRESS', 1000, 0, 0, 'John Smith', 'Material Handler 1', '2025-01-08 08:00:00+00', NULL, NULL, NULL, 'Starting panel preparation'),
((SELECT id FROM production_work_orders WHERE work_order_number = 'WO-001'), (SELECT id FROM production_operations WHERE operation_code = 'OP-002'), 'BATCH-001', 'START', 'IN_PROGRESS', 1000, 0, 0, 'Jane Doe', 'CNC Drill 2', '2025-01-08 09:00:00+00', NULL, NULL, NULL, 'Starting drilling operation'),
((SELECT id FROM production_work_orders WHERE work_order_number = 'WO-001'), (SELECT id FROM production_operations WHERE operation_code = 'OP-001'), 'BATCH-001', 'COMPLETE', 'COMPLETED', 1000, 2, 0, 'John Smith', 'Material Handler 1', '2025-01-08 08:00:00+00', '2025-01-08 08:15:00+00', 15.00, 99.80, 'Panel preparation completed with 2 scrap panels'),
((SELECT id FROM production_work_orders WHERE work_order_number = 'WO-002'), (SELECT id FROM production_operations WHERE operation_code = 'OP-013'), 'BATCH-002', 'START', 'IN_PROGRESS', 500, 0, 0, 'Bob Johnson', 'Material Handler 2', '2025-01-10 07:00:00+00', NULL, NULL, NULL, 'Starting RF material preparation'),
((SELECT id FROM production_work_orders WHERE work_order_number = 'WO-002'), (SELECT id FROM production_operations WHERE operation_code = 'OP-014'), 'BATCH-002', 'START', 'IN_PROGRESS', 500, 0, 0, 'Alice Brown', 'High-Precision Drill 1', '2025-01-10 07:30:00+00', NULL, NULL, NULL, 'Starting precision drilling'),
((SELECT id FROM production_work_orders WHERE work_order_number = 'WO-003'), (SELECT id FROM production_operations WHERE operation_code = 'OP-001'), 'BATCH-003', 'START', 'IN_PROGRESS', 100, 0, 0, 'Charlie Wilson', 'Material Handler 3', '2025-01-12 09:00:00+00', NULL, NULL, NULL, 'Starting prototype preparation');

-- Sample Machine Capacity records
INSERT INTO production_machine_capacity (
    machine_id, machine_name, machine_type, date, shift, shift_start, shift_end, planned_hours, available_hours, utilization_percentage, status, work_order_id, operation_id, assigned_quantity, completed_quantity, setup_time_minutes, downtime_minutes, maintenance_hours, oee_availability, oee_performance, oee_quality, oee_overall, capacity_notes
) VALUES 
(gen_random_uuid(), 'Material Handler 1', 'Material Handler', '2025-01-08', 'FIRST', '2025-01-08 06:00:00+00', '2025-01-08 14:00:00+00', 8.00, 7.50, 93.75, 'IN_USE', (SELECT id FROM production_work_orders WHERE work_order_number = 'WO-001'), (SELECT id FROM production_operations WHERE operation_code = 'OP-001'), 1000, 1000, 5.00, 25.00, 0.00, 95.83, 98.50, 99.80, 94.25, 'Good performance today'),
(gen_random_uuid(), 'CNC Drill 2', 'CNC Drill', '2025-01-08', 'FIRST', '2025-01-08 06:00:00+00', '2025-01-08 14:00:00+00', 8.00, 7.00, 87.50, 'IN_USE', (SELECT id FROM production_work_orders WHERE work_order_number = 'WO-001'), (SELECT id FROM production_operations WHERE operation_code = 'OP-002'), 1000, 950, 8.00, 52.00, 0.00, 91.67, 92.00, 99.80, 84.00, 'Minor tool wear detected'),
(gen_random_uuid(), 'Material Handler 2', 'Material Handler', '2025-01-10', 'FIRST', '2025-01-10 06:00:00+00', '2025-01-10 14:00:00+00', 8.00, 8.00, 100.00, 'IN_USE', (SELECT id FROM production_work_orders WHERE work_order_number = 'WO-002'), (SELECT id FROM production_operations WHERE operation_code = 'OP-013'), 500, 500, 8.00, 0.00, 0.00, 100.00, 100.00, 100.00, 100.00, 'Excellent performance'),
(gen_random_uuid(), 'High-Precision Drill 1', 'High-Precision Drill', '2025-01-10', 'FIRST', '2025-01-10 06:00:00+00', '2025-01-10 14:00:00+00', 8.00, 7.80, 97.50, 'IN_USE', (SELECT id FROM production_work_orders WHERE work_order_number = 'WO-002'), (SELECT id FROM production_operations WHERE operation_code = 'OP-014'), 500, 495, 12.00, 12.00, 0.00, 97.50, 98.00, 99.00, 94.60, 'Precision maintained'),
(gen_random_uuid(), 'Material Handler 3', 'Material Handler', '2025-01-12', 'FIRST', '2025-01-12 06:00:00+00', '2025-01-12 14:00:00+00', 8.00, 8.00, 100.00, 'IN_USE', (SELECT id FROM production_work_orders WHERE work_order_number = 'WO-003'), (SELECT id FROM production_operations WHERE operation_code = 'OP-001'), 100, 100, 5.00, 0.00, 0.00, 100.00, 100.00, 100.00, 100.00, 'Prototype run completed');

-- Add comments for documentation
COMMENT ON TABLE production_work_orders IS 'Work orders for manufacturing PCBs and other products';
COMMENT ON TABLE production_routings IS 'Manufacturing routings defining operation sequences';
COMMENT ON TABLE production_operations IS 'Individual manufacturing operations within routings';
COMMENT ON TABLE production_wip_events IS 'Work-in-progress tracking and status events';
COMMENT ON TABLE production_machine_capacity IS 'Machine capacity planning and utilization tracking';

COMMENT ON COLUMN production_work_orders.work_order_number IS 'Unique identifier for the work order';
COMMENT ON COLUMN production_work_orders.status IS 'Current status of the work order';
COMMENT ON COLUMN production_routings.routing_code IS 'Unique identifier for the routing';
COMMENT ON COLUMN production_operations.operation_code IS 'Unique identifier for the operation';
COMMENT ON COLUMN production_wip_events.event_type IS 'Type of WIP event (START, COMPLETE, etc.)';
COMMENT ON COLUMN production_machine_capacity.shift IS 'Shift designation (FIRST, SECOND, THIRD, OVERTIME)';

-- Log migration completion
INSERT INTO user_audit_log (user_id, action, resource_type, resource_id, request_data, response_data, created_at) 
VALUES (
    (SELECT id FROM users WHERE username = 'admin'), 
    'MIGRATION', 
    'DATABASE', 
    'V6__create_production_tables.sql', 
    '{"tables": ["production_work_orders", "production_routings", "production_operations", "production_wip_events", "production_machine_capacity"]}', 
    '{"status": "COMPLETED", "records_inserted": 25}', 
    NOW()
);

-- Display completion message
SELECT 'Production module tables created successfully with sample data' AS migration_status;