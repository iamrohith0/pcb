
-- Warehouse Module Database Schema
-- Creates tables for warehouse management, locations, picking, and packing operations
-- Version: V11
-- Date: 2025-01-11
-- Assumes update_updated_at_column() function is available from earlier migrations

-- Warehouses table
-- Stores information about physical warehouses and storage facilities
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    warehouse_type VARCHAR(50),
    plant_id UUID,
    plant_name VARCHAR(100),
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Address fields
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    country VARCHAR(100),
    
    -- Contact information
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    
    -- Capacity and dimensions
    total_capacity DECIMAL(15,3),
    used_capacity DECIMAL(15,3),
    capacity_unit VARCHAR(20),
    area_sqm DECIMAL(15,3),
    
    -- Operational flags
    supports_serialization BOOLEAN NOT NULL DEFAULT false,
    supports_lot_tracking BOOLEAN NOT NULL DEFAULT false,
    supports_bulk_storage BOOLEAN NOT NULL DEFAULT false,
    supports_temperature_control BOOLEAN NOT NULL DEFAULT false,
    temperature_range VARCHAR(50),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_warehouses_capacity CHECK (total_capacity IS NULL OR total_capacity >= 0),
    CONSTRAINT chk_warehouses_used_capacity CHECK (used_capacity IS NULL OR used_capacity >= 0),
    CONSTRAINT chk_warehouses_area CHECK (area_sqm IS NULL OR area_sqm >= 0)
);

-- Locations table
-- Stores specific storage locations within warehouses (bins, racks, shelves, etc.)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    warehouse_name VARCHAR(200),
    location_type VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Location hierarchy/path
    zone VARCHAR(50),
    aisle VARCHAR(50),
    rack VARCHAR(50),
    shelf VARCHAR(50),
    bin VARCHAR(50),
    
    -- Physical dimensions and capacity
    max_capacity DECIMAL(15,3),
    current_capacity DECIMAL(15,3),
    capacity_unit VARCHAR(20),
    length DECIMAL(10,3),
    width DECIMAL(10,3),
    height DECIMAL(10,3),
    volume DECIMAL(15,3),
    
    -- Status and restrictions
    status VARCHAR(50),
    is_locked BOOLEAN NOT NULL DEFAULT false,
    is_quarantine BOOLEAN NOT NULL DEFAULT false,
    is_bulk_storage BOOLEAN NOT NULL DEFAULT false,
    supports_serialization BOOLEAN NOT NULL DEFAULT false,
    supports_lot_tracking BOOLEAN NOT NULL DEFAULT false,
    
    -- Restrictions
    restricted_item_types VARCHAR(500),
    max_items_per_location INTEGER,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_locations_capacity CHECK (max_capacity IS NULL OR max_capacity >= 0),
    CONSTRAINT chk_locations_current_capacity CHECK (current_capacity IS NULL OR current_capacity >= 0),
    CONSTRAINT chk_locations_length CHECK (length IS NULL OR length >= 0),
    CONSTRAINT chk_locations_width CHECK (width IS NULL OR width >= 0),
    CONSTRAINT chk_locations_height CHECK (height IS NULL OR height >= 0),
    CONSTRAINT chk_locations_volume CHECK (volume IS NULL OR volume >= 0),
    CONSTRAINT chk_locations_max_items CHECK (max_items_per_location IS NULL OR max_items_per_location > 0)
);

-- Picking table
-- Tracks picking operations for warehouse items
CREATE TABLE pickings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(200),
    warehouse_id UUID NOT NULL,
    warehouse_name VARCHAR(200),
    location_id UUID,
    location_code VARCHAR(100),
    location_name VARCHAR(200),
    item_id UUID NOT NULL,
    item_code VARCHAR(50),
    item_name VARCHAR(200),
    batch_id UUID,
    batch_code VARCHAR(100),
    serial_id UUID,
    serial_code VARCHAR(100),
    shipment_id UUID,
    shipment_code VARCHAR(100),
    work_order VARCHAR(100),
    customer VARCHAR(200),
    priority VARCHAR(50),
    status VARCHAR(50),
    quantity_requested DECIMAL(15,3),
    quantity_picked DECIMAL(15,3),
    quantity_confirmed DECIMAL(15,3),
    unit_of_measure VARCHAR(20),
    picking_type VARCHAR(50),
    assigned_to VARCHAR(100),
    picked_by VARCHAR(100),
    confirmed_by VARCHAR(100),
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    picked_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT chk_pickings_quantity_requested CHECK (quantity_requested IS NULL OR quantity_requested >= 0),
    CONSTRAINT chk_pickings_quantity_picked CHECK (quantity_picked IS NULL OR quantity_picked >= 0),
    CONSTRAINT chk_pickings_quantity_confirmed CHECK (quantity_confirmed IS NULL OR quantity_confirmed >= 0)
);

-- Packing table
-- Tracks packing operations for warehouse items
CREATE TABLE packings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(200),
    warehouse_id UUID NOT NULL,
    warehouse_name VARCHAR(200),
    location_id UUID,
    location_code VARCHAR(100),
    location_name VARCHAR(200),
    item_id UUID NOT NULL,
    item_code VARCHAR(50),
    item_name VARCHAR(200),
    batch_id UUID,
    batch_code VARCHAR(100),
    serial_id UUID,
    serial_code VARCHAR(100),
    shipment_id UUID,
    shipment_code VARCHAR(100),
    work_order VARCHAR(100),
    pick_list_id UUID,
    pick_list_code VARCHAR(100),
    customer VARCHAR(200),
    priority VARCHAR(50),
    status VARCHAR(50),
    quantity_to_pack DECIMAL(15,3),
    quantity_packed DECIMAL(15,3),
    quantity_confirmed DECIMAL(15,3),
    unit_of_measure VARCHAR(20),
    packing_type VARCHAR(50),
    carton_type VARCHAR(100),
    carton_code VARCHAR(100),
    carton_quantity INTEGER,
    weight DECIMAL(15,3),
    weight_unit VARCHAR(20),
    dimensions_length DECIMAL(10,3),
    dimensions_width DECIMAL(10,3),
    dimensions_height DECIMAL(10,3),
    dimensions_unit VARCHAR(20),
    assigned_to VARCHAR(100),
    packed_by VARCHAR(100),
    confirmed_by VARCHAR(100),
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    packed_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT chk_packings_quantity_to_pack CHECK (quantity_to_pack IS NULL OR quantity_to_pack >= 0),
    CONSTRAINT chk_packings_quantity_packed CHECK (quantity_packed IS NULL OR quantity_packed >= 0),
    CONSTRAINT chk_packings_quantity_confirmed CHECK (quantity_confirmed IS NULL OR quantity_confirmed >= 0),
    CONSTRAINT chk_packings_weight CHECK (weight IS NULL OR weight >= 0),
    CONSTRAINT chk_packings_dimensions_length CHECK (dimensions_length IS NULL OR dimensions_length >= 0),
    CONSTRAINT chk_packings_dimensions_width CHECK (dimensions_width IS NULL OR dimensions_width >= 0),
    CONSTRAINT chk_packings_dimensions_height CHECK (dimensions_height IS NULL OR dimensions_height >= 0),
    CONSTRAINT chk_packings_carton_quantity CHECK (carton_quantity IS NULL OR carton_quantity > 0)
);

-- Indexes for performance optimization
CREATE INDEX idx_warehouses_code ON warehouses(code);
CREATE INDEX idx_warehouses_name ON warehouses(name);
CREATE INDEX idx_warehouses_type ON warehouses(warehouse_type);
CREATE INDEX idx_warehouses_plant_id ON warehouses(plant_id);
CREATE INDEX idx_warehouses_status ON warehouses(is_active);
CREATE INDEX idx_warehouses_is_default ON warehouses(is_default);
CREATE INDEX idx_warehouses_created_at ON warehouses(created_at);
CREATE INDEX idx_warehouses_updated_at ON warehouses(updated_at);

CREATE INDEX idx_locations_code ON locations(code);
CREATE INDEX idx_locations_warehouse_id ON locations(warehouse_id);
CREATE INDEX idx_locations_type ON locations(location_type);
CREATE INDEX idx_locations_status ON locations(status);
CREATE INDEX idx_locations_zone ON locations(zone);
CREATE INDEX idx_locations_aisle ON locations(aisle);
CREATE INDEX idx_locations_rack ON locations(rack);
CREATE INDEX idx_locations_shelf ON locations(shelf);
CREATE INDEX idx_locations_bin ON locations(bin);
CREATE INDEX idx_locations_created_at ON locations(created_at);
CREATE INDEX idx_locations_updated_at ON locations(updated_at);

CREATE INDEX idx_pickings_code ON pickings(code);
CREATE INDEX idx_pickings_status ON pickings(status);
CREATE INDEX idx_pickings_warehouse_id ON pickings(warehouse_id);
CREATE INDEX idx_pickings_location_id ON pickings(location_id);
CREATE INDEX idx_pickings_item_id ON pickings(item_id);
CREATE INDEX idx_pickings_batch_id ON pickings(batch_id);
CREATE INDEX idx_pickings_serial_id ON pickings(serial_id);
CREATE INDEX idx_pickings_shipment_id ON pickings(shipment_id);
CREATE INDEX idx_pickings_work_order ON pickings(work_order);
CREATE INDEX idx_pickings_created_at ON pickings(created_at);
CREATE INDEX idx_pickings_updated_at ON pickings(updated_at);

CREATE INDEX idx_packings_code ON packings(code);
CREATE INDEX idx_packings_status ON packings(status);
CREATE INDEX idx_packings_warehouse_id ON packings(warehouse_id);
CREATE INDEX idx_packings_location_id ON packings(location_id);
CREATE INDEX idx_packings_item_id ON packings(item_id);
CREATE INDEX idx_packings_batch_id ON packings(batch_id);
CREATE INDEX idx_packings_serial_id ON packings(serial_id);
CREATE INDEX idx_packings_shipment_id ON packings(shipment_id);
CREATE INDEX idx_packings_work_order ON packings(work_order);
CREATE INDEX idx_packings_pick_list_id ON packings(pick_list_id);
CREATE INDEX idx_packings_created_at ON packings(created_at);
CREATE INDEX idx_packings_updated_at ON packings(updated_at);

-- Check constraints for enum values
ALTER TABLE warehouses 
    ADD CONSTRAINT chk_warehouses_type 
    CHECK (warehouse_type IN ('RAW_MATERIAL', 'FINISHED_GOODS', 'WIP', 'DISPATCH', 'RECEIVING', 'QUARANTINE', 'REWORK', 'SCRAP'));

ALTER TABLE locations 
    ADD CONSTRAINT chk_locations_type 
    CHECK (location_type IN ('BIN', 'SHELF', 'RACK', 'PALLET', 'FLOOR', 'CAGE', 'CONTAINER', 'TOTE'));

ALTER TABLE locations 
    ADD CONSTRAINT chk_locations_status 
    CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'DISABLED'));

ALTER TABLE pickings 
    ADD CONSTRAINT chk_pickings_priority 
    CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'));

ALTER TABLE pickings 
    ADD CONSTRAINT chk_pickings_status 
    CHECK (status IN ('DRAFT', 'OPEN', 'PICKING', 'PICKED', 'CONFIRMED', 'CANCELLED'));

ALTER TABLE pickings 
    ADD CONSTRAINT chk_pickings_type 
    CHECK (picking_type IN ('PICK_TO_LIGHT', 'PICK_TO_VOICE', 'PICK_TO_CART', 'MANUAL'));

ALTER TABLE packings 
    ADD CONSTRAINT chk_packings_priority 
    CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'));

ALTER TABLE packings 
    ADD CONSTRAINT chk_packings_status 
    CHECK (status IN ('DRAFT', 'OPEN', 'PACKING', 'PACKED', 'CONFIRMED', 'CANCELLED'));

ALTER TABLE packings 
    ADD CONSTRAINT chk_packings_type 
    CHECK (packing_type IN ('INDIVIDUAL', 'BATCH', 'CARTON', 'PALLET', 'CUSTOM'));

-- Triggers for updated_at timestamps
CREATE TRIGGER update_warehouses_updated_at
    BEFORE UPDATE ON warehouses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pickings_updated_at
    BEFORE UPDATE ON pickings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packings_updated_at
    BEFORE UPDATE ON packings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE warehouses IS 'Stores information about physical warehouses and storage facilities';
COMMENT ON TABLE locations IS 'Stores specific storage locations within warehouses (bins, racks, shelves, etc.)';
COMMENT ON TABLE pickings IS 'Tracks picking operations for warehouse items';
COMMENT ON TABLE packings IS 'Tracks packing operations for warehouse items';

COMMENT ON COLUMN warehouses.code IS 'Unique identifier for the warehouse';
COMMENT ON COLUMN warehouses.warehouse_type IS 'Type of warehouse (RAW_MATERIAL, FINISHED_GOODS, WIP, DISPATCH, RECEIVING, QUARANTINE, REWORK, SCRAP)';
COMMENT ON COLUMN warehouses.is_default IS 'Indicates if this is the default warehouse';
COMMENT ON COLUMN warehouses.supports_serialization IS 'Indicates if warehouse supports item serialization';
COMMENT ON COLUMN warehouses.supports_lot_tracking IS 'Indicates if warehouse supports lot tracking';
COMMENT ON COLUMN warehouses.supports_bulk_storage IS 'Indicates if warehouse supports bulk storage';
COMMENT ON COLUMN warehouses.supports_temperature_control IS 'Indicates if warehouse supports temperature control';

COMMENT ON COLUMN locations.code IS 'Unique identifier for the location';
COMMENT ON COLUMN locations.location_type IS 'Type of location (BIN, SHELF, RACK, PALLET, FLOOR, CAGE, CONTAINER, TOTE)';
COMMENT ON COLUMN locations.status IS 'Current status of the location (AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, DISABLED)';
COMMENT ON COLUMN locations.zone IS 'Zone identifier within the warehouse';
COMMENT ON COLUMN locations.aisle IS 'Aisle identifier within the warehouse';
COMMENT ON COLUMN locations.rack IS 'Rack identifier within the warehouse';
COMMENT ON COLUMN locations.shelf IS 'Shelf identifier within the warehouse';
COMMENT ON COLUMN locations.bin IS 'Bin identifier within the warehouse';

COMMENT ON COLUMN pickings.code IS 'Unique identifier for the picking operation';
COMMENT ON COLUMN pickings.priority IS 'Priority level of the picking operation (LOW, NORMAL, HIGH, URGENT)';
COMMENT ON COLUMN pickings.status IS 'Current status of the picking operation (DRAFT, OPEN, PICKING, PICKED, CONFIRMED, CANCELLED)';
COMMENT ON COLUMN pickings.picking_type IS 'Type of picking method (PICK_TO_LIGHT, PICK_TO_VOICE, PICK_TO_CART, MANUAL)';

COMMENT ON COLUMN packings.code IS 'Unique identifier for the packing operation';
COMMENT ON COLUMN packings.priority IS 'Priority level of the packing operation (LOW, NORMAL, HIGH, URGENT)';
COMMENT ON COLUMN packings.status IS 'Current status of the packing operation (DRAFT, OPEN, PACKING, PACKED, CONFIRMED, CANCELLED)';
COMMENT ON COLUMN packings.packing_type IS 'Type of packing method (INDIVIDUAL, BATCH, CARTON, PALLET, CUSTOM)';

