-- Inventory Management System Database Migration
-- Creates all tables for the Inventory module

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    sku VARCHAR(100),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    item_type VARCHAR(50),
    unit_of_measure VARCHAR(20),
    reorder_level INTEGER,
    reorder_quantity INTEGER,
    min_stock_level INTEGER,
    max_stock_level INTEGER,
    cost_price DECIMAL(15,2),
    selling_price DECIMAL(15,2),
    weight DECIMAL(10,3),
    length DECIMAL(10,3),
    width DECIMAL(10,3),
    height DECIMAL(10,3),
    volume DECIMAL(15,3),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_serialized BOOLEAN NOT NULL DEFAULT false,
    is_lot_tracked BOOLEAN NOT NULL DEFAULT false,
    shelf_life_days INTEGER,
    hazardous_material BOOLEAN NOT NULL DEFAULT false,
    storage_conditions VARCHAR(200),
    supplier_part_number VARCHAR(100),
    manufacturer VARCHAR(100),
    manufacturer_part_number VARCHAR(100),
    barcode VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create inventory_stock table
CREATE TABLE IF NOT EXISTS inventory_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    warehouse_id UUID NOT NULL,
    location_id UUID,
    lot_id UUID,
    serial_id UUID,
    quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
    reserved_quantity DECIMAL(15,3) DEFAULT 0,
    available_quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
    on_order_quantity DECIMAL(15,3) DEFAULT 0,
    committed_quantity DECIMAL(15,3) DEFAULT 0,
    stock_status VARCHAR(50),
    cost_per_unit DECIMAL(15,2),
    total_value DECIMAL(15,2),
    last_movement_date TIMESTAMP WITH TIME ZONE,
    expiration_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create inventory_lots table
CREATE TABLE IF NOT EXISTS inventory_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_number VARCHAR(100) NOT NULL UNIQUE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    supplier_id UUID,
    received_date TIMESTAMP WITH TIME ZONE,
    manufacture_date TIMESTAMP WITH TIME ZONE,
    expiration_date TIMESTAMP WITH TIME ZONE,
    quantity_received DECIMAL(15,3),
    quantity_available DECIMAL(15,3) NOT NULL DEFAULT 0,
    quantity_used DECIMAL(15,3) DEFAULT 0,
    quantity_scrapped DECIMAL(15,3) DEFAULT 0,
    cost_per_unit DECIMAL(15,2),
    total_cost DECIMAL(15,2),
    status VARCHAR(50),
    storage_location VARCHAR(200),
    batch_reference VARCHAR(100),
    certificate_of_analysis VARCHAR(200),
    quality_status VARCHAR(50),
    quarantine_reason VARCHAR(500),
    parent_lot_id UUID,
    child_lot_ids TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create inventory_serials table
CREATE TABLE IF NOT EXISTS inventory_serials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    lot_id UUID,
    work_order_id UUID,
    received_date TIMESTAMP WITH TIME ZONE,
    manufacture_date TIMESTAMP WITH TIME ZONE,
    expiration_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50),
    storage_location VARCHAR(200),
    parent_serial_id UUID,
    child_serial_ids TEXT,
    current_location VARCHAR(200),
    current_warehouse_id UUID,
    current_work_order_id UUID,
    quality_status VARCHAR(50),
    quarantine_reason VARCHAR(500),
    test_results TEXT,
    repair_history TEXT,
    warranty_expiry_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create inventory_adjustments table
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_number VARCHAR(100) NOT NULL UNIQUE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    warehouse_id UUID NOT NULL,
    location_id UUID,
    lot_id UUID,
    serial_id UUID,
    adjustment_type VARCHAR(50),
    adjustment_reason VARCHAR(200),
    quantity_before DECIMAL(15,3),
    quantity_after DECIMAL(15,3),
    quantity_difference DECIMAL(15,3),
    cost_per_unit DECIMAL(15,2),
    total_value DECIMAL(15,2),
    status VARCHAR(50),
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    performed_by VARCHAR(100),
    performed_at TIMESTAMP WITH TIME ZONE,
    reference_document VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create inventory_boms table
CREATE TABLE IF NOT EXISTS inventory_boms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bom_number VARCHAR(100) NOT NULL UNIQUE,
    product_item_id UUID NOT NULL REFERENCES inventory_items(id),
    revision VARCHAR(20),
    version VARCHAR(20),
    description VARCHAR(500),
    status VARCHAR(50),
    effective_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    unit_of_measure VARCHAR(20),
    quantity_per_unit DECIMAL(15,3),
    assembly_level INTEGER,
    engineer VARCHAR(100),
    approver VARCHAR(100),
    approved_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_code ON inventory_items(item_code);
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);

CREATE INDEX IF NOT EXISTS idx_inventory_stock_item_id ON inventory_stock(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_warehouse_id ON inventory_stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_location_id ON inventory_stock(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_lot_id ON inventory_stock(lot_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_serial_id ON inventory_stock(serial_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_status ON inventory_stock(stock_status);

CREATE INDEX IF NOT EXISTS idx_inventory_lots_lot_number ON inventory_lots(lot_number);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_item_id ON inventory_lots(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_status ON inventory_lots(status);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_expiration_date ON inventory_lots(expiration_date);

CREATE INDEX IF NOT EXISTS idx_inventory_serials_serial_number ON inventory_serials(serial_number);
CREATE INDEX IF NOT EXISTS idx_inventory_serials_item_id ON inventory_serials(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_serials_status ON inventory_serials(status);
CREATE INDEX IF NOT EXISTS idx_inventory_serials_work_order_id ON inventory_serials(work_order_id);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_adjustment_number ON inventory_adjustments(adjustment_number);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_item_id ON inventory_adjustments(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_status ON inventory_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_type ON inventory_adjustments(adjustment_type);

CREATE INDEX IF NOT EXISTS idx_inventory_boms_bom_number ON inventory_boms(bom_number);
CREATE INDEX IF NOT EXISTS idx_inventory_boms_product_item_id ON inventory_boms(product_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_boms_status ON inventory_boms(status);
CREATE INDEX IF NOT EXISTS idx_inventory_boms_effective_date ON inventory_boms(effective_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER update_inventory_items_updated_at 
    BEFORE UPDATE ON inventory_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_stock_updated_at ON inventory_stock;
CREATE TRIGGER update_inventory_stock_updated_at 
    BEFORE UPDATE ON inventory_stock 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_lots_updated_at ON inventory_lots;
CREATE TRIGGER update_inventory_lots_updated_at 
    BEFORE UPDATE ON inventory_lots 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_serials_updated_at ON inventory_serials;
CREATE TRIGGER update_inventory_serials_updated_at 
    BEFORE UPDATE ON inventory_serials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_adjustments_updated_at ON inventory_adjustments;
CREATE TRIGGER update_inventory_adjustments_updated_at 
    BEFORE UPDATE ON inventory_adjustments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_boms_updated_at ON inventory_boms;
CREATE TRIGGER update_inventory_boms_updated_at 
    BEFORE UPDATE ON inventory_boms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();