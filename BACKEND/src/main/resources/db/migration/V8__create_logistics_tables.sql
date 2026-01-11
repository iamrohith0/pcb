-- PCBxpress ERP - Logistics Module Database Migration
-- Creates tables for shipping, receiving, transportation, and warehouse operations
-- Version: V8
-- Date: 2025-01-11

-- Shipping Orders table
CREATE TABLE IF NOT EXISTS shipping_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipping_order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_code VARCHAR(50),
    sales_order_id UUID,
    sales_order_number VARCHAR(50),
    work_order_id UUID,
    work_order_number VARCHAR(50),
    shipment_type VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    shipping_date TIMESTAMP WITH TIME ZONE,
    estimated_delivery_date TIMESTAMP WITH TIME ZONE,
    actual_delivery_date TIMESTAMP WITH TIME ZONE,
    carrier_id UUID,
    carrier_name VARCHAR(200),
    carrier_service VARCHAR(100),
    tracking_number VARCHAR(100),
    freight_terms VARCHAR(50),
    freight_cost DECIMAL(15,2) DEFAULT 0.00,
    insurance_value DECIMAL(15,2) DEFAULT 0.00,
    packaging_type VARCHAR(50),
    package_count INTEGER DEFAULT 1,
    total_weight DECIMAL(10,3),
    total_volume DECIMAL(15,3),
    declared_value DECIMAL(15,2) DEFAULT 0.00,
    hazardous_material BOOLEAN NOT NULL DEFAULT false,
    temperature_controlled BOOLEAN NOT NULL DEFAULT false,
    special_handling VARCHAR(200),
    pickup_location VARCHAR(500),
    delivery_location VARCHAR(500),
    delivery_contact_name VARCHAR(100),
    delivery_contact_phone VARCHAR(20),
    delivery_contact_email VARCHAR(150),
    delivery_instructions TEXT,
    pickup_instructions TEXT,
    notes TEXT,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    packed_by VARCHAR(100),
    packed_at TIMESTAMP WITH TIME ZONE,
    shipped_by VARCHAR(100),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_by VARCHAR(100),
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Shipping Order Lines table
CREATE TABLE IF NOT EXISTS shipping_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipping_order_id UUID NOT NULL REFERENCES shipping_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    item_code VARCHAR(50),
    item_description TEXT,
    quantity DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    unit_price DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    line_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    lot_id UUID,
    lot_number VARCHAR(100),
    serial_id UUID,
    serial_number VARCHAR(100),
    warehouse_id UUID NOT NULL,
    warehouse_name VARCHAR(100),
    location_id UUID,
    location_name VARCHAR(100),
    picked_quantity DECIMAL(15,4) DEFAULT 0.0000,
    packed_quantity DECIMAL(15,4) DEFAULT 0.0000,
    shipped_quantity DECIMAL(15,4) DEFAULT 0.0000,
    backorder_quantity DECIMAL(15,4) DEFAULT 0.0000,
    weight DECIMAL(10,3),
    volume DECIMAL(15,3),
    packaging_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Receiving Orders table
CREATE TABLE IF NOT EXISTS receiving_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receiving_order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    supplier_code VARCHAR(50),
    purchase_order_id UUID,
    purchase_order_number VARCHAR(50),
    receipt_type VARCHAR(50) NOT NULL DEFAULT 'GOODS',
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    expected_date TIMESTAMP WITH TIME ZONE,
    received_date TIMESTAMP WITH TIME ZONE,
    carrier_id UUID,
    carrier_name VARCHAR(200),
    carrier_service VARCHAR(100),
    tracking_number VARCHAR(100),
    bill_of_lading VARCHAR(100),
    container_number VARCHAR(50),
    seal_number VARCHAR(50),
    temperature_recorded DECIMAL(5,2),
    temperature_unit VARCHAR(10),
    humidity_recorded DECIMAL(5,2),
    humidity_unit VARCHAR(10),
    total_packages INTEGER DEFAULT 0,
    total_weight DECIMAL(10,3),
    total_volume DECIMAL(15,3),
    hazardous_material BOOLEAN NOT NULL DEFAULT false,
    temperature_controlled BOOLEAN NOT NULL DEFAULT false,
    special_handling VARCHAR(200),
    receiving_dock VARCHAR(50),
    receiving_bay VARCHAR(50),
    received_by VARCHAR(100),
    inspected_by VARCHAR(100),
    inspection_date TIMESTAMP WITH TIME ZONE,
    inspection_status VARCHAR(50),
    inspection_notes TEXT,
    quarantine_required BOOLEAN NOT NULL DEFAULT false,
    quarantine_location VARCHAR(200),
    quarantine_reason VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Receiving Order Lines table
CREATE TABLE IF NOT EXISTS receiving_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receiving_order_id UUID NOT NULL REFERENCES receiving_orders(id) ON DELETE CASCADE,
    po_line_id UUID,
    item_id UUID NOT NULL,
    item_code VARCHAR(50),
    item_description TEXT,
    expected_quantity DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    received_quantity DECIMAL(15,4) DEFAULT 0.0000,
    accepted_quantity DECIMAL(15,4) DEFAULT 0.0000,
    rejected_quantity DECIMAL(15,4) DEFAULT 0.0000,
    damaged_quantity DECIMAL(15,4) DEFAULT 0.0000,
    short_quantity DECIMAL(15,4) DEFAULT 0.0000,
    excess_quantity DECIMAL(15,4) DEFAULT 0.0000,
    unit_price DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    line_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    expiry_date TIMESTAMP WITH TIME ZONE,
    serial_numbers TEXT,
    warehouse_id UUID NOT NULL,
    warehouse_name VARCHAR(100),
    location_id UUID,
    location_name VARCHAR(100),
    putaway_location VARCHAR(100),
    putaway_completed_at TIMESTAMP WITH TIME ZONE,
    qc_status VARCHAR(30) DEFAULT 'PENDING',
    qc_remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Transportation Carriers table
CREATE TABLE IF NOT EXISTS carriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    company_name VARCHAR(200),
    contact_person VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(20),
    website VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    carrier_type VARCHAR(50) NOT NULL,
    service_level VARCHAR(50),
    transit_time_days INTEGER,
    base_rate DECIMAL(15,2) DEFAULT 0.00,
    rate_per_kg DECIMAL(10,4) DEFAULT 0.0000,
    rate_per_cbm DECIMAL(10,4) DEFAULT 0.0000,
    minimum_charge DECIMAL(15,2) DEFAULT 0.00,
    insurance_rate DECIMAL(5,4) DEFAULT 0.0000,
    tracking_url_template VARCHAR(500),
    api_enabled BOOLEAN NOT NULL DEFAULT false,
    api_endpoint VARCHAR(500),
    api_key VARCHAR(200),
    api_secret VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Carrier Services table
CREATE TABLE IF NOT EXISTS carrier_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    service_code VARCHAR(50) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    transit_time_days INTEGER,
    delivery_hours VARCHAR(100),
    saturday_delivery BOOLEAN NOT NULL DEFAULT false,
    sunday_delivery BOOLEAN NOT NULL DEFAULT false,
    tracking_enabled BOOLEAN NOT NULL DEFAULT true,
    insurance_available BOOLEAN NOT NULL DEFAULT false,
    signature_required BOOLEAN NOT NULL DEFAULT false,
    adult_signature_required BOOLEAN NOT NULL DEFAULT false,
    delivery_confirmation BOOLEAN NOT NULL DEFAULT false,
    base_rate DECIMAL(15,2) DEFAULT 0.00,
    rate_per_kg DECIMAL(10,4) DEFAULT 0.0000,
    rate_per_cbm DECIMAL(10,4) DEFAULT 0.0000,
    minimum_charge DECIMAL(15,2) DEFAULT 0.00,
    insurance_rate DECIMAL(5,4) DEFAULT 0.0000,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Freight Quotes table
CREATE TABLE IF NOT EXISTS freight_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    carrier_id UUID NOT NULL REFERENCES carriers(id),
    carrier_name VARCHAR(200) NOT NULL,
    origin_address VARCHAR(500) NOT NULL,
    destination_address VARCHAR(500) NOT NULL,
    origin_city VARCHAR(100),
    origin_state VARCHAR(100),
    origin_country VARCHAR(50),
    destination_city VARCHAR(100),
    destination_state VARCHAR(100),
    destination_country VARCHAR(50),
    shipment_date TIMESTAMP WITH TIME ZONE,
    estimated_delivery_date TIMESTAMP WITH TIME ZONE,
    service_type VARCHAR(50),
    package_count INTEGER NOT NULL DEFAULT 1,
    total_weight DECIMAL(10,3),
    total_volume DECIMAL(15,3),
    weight_unit VARCHAR(10) DEFAULT 'KG',
    volume_unit VARCHAR(10) DEFAULT 'CBM',
    commodity VARCHAR(200),
    hazardous_material BOOLEAN NOT NULL DEFAULT false,
    temperature_controlled BOOLEAN NOT NULL DEFAULT false,
    insurance_required BOOLEAN NOT NULL DEFAULT false,
    insurance_value DECIMAL(15,2) DEFAULT 0.00,
    pickup_required BOOLEAN NOT NULL DEFAULT false,
    delivery_required BOOLEAN NOT NULL DEFAULT false,
    base_charge DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    fuel_surcharge DECIMAL(15,2) DEFAULT 0.00,
    handling_fee DECIMAL(15,2) DEFAULT 0.00,
    customs_fee DECIMAL(15,2) DEFAULT 0.00,
    insurance_fee DECIMAL(15,2) DEFAULT 0.00,
    other_fees DECIMAL(15,2) DEFAULT 0.00,
    total_charge DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    validity_days INTEGER DEFAULT 7,
    quote_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    quoted_by VARCHAR(100),
    quoted_at TIMESTAMP WITH TIME ZONE,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    expired_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Freight Bookings table
CREATE TABLE IF NOT EXISTS freight_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    quote_id UUID REFERENCES freight_quotes(id),
    carrier_id UUID NOT NULL REFERENCES carriers(id),
    carrier_name VARCHAR(200) NOT NULL,
    customer_id UUID NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_code VARCHAR(50),
    booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
    shipment_date TIMESTAMP WITH TIME ZONE,
    pickup_date TIMESTAMP WITH TIME ZONE,
    delivery_date TIMESTAMP WITH TIME ZONE,
    origin_address VARCHAR(500) NOT NULL,
    destination_address VARCHAR(500) NOT NULL,
    origin_contact_name VARCHAR(100),
    origin_contact_phone VARCHAR(20),
    origin_contact_email VARCHAR(150),
    destination_contact_name VARCHAR(100),
    destination_contact_phone VARCHAR(20),
    destination_contact_email VARCHAR(150),
    service_type VARCHAR(50),
    booking_status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    tracking_number VARCHAR(100),
    pro_number VARCHAR(100),
    bill_of_lading VARCHAR(100),
    container_number VARCHAR(50),
    seal_number VARCHAR(50),
    package_count INTEGER NOT NULL DEFAULT 1,
    total_weight DECIMAL(10,3),
    total_volume DECIMAL(15,3),
    declared_value DECIMAL(15,2) DEFAULT 0.00,
    insurance_value DECIMAL(15,2) DEFAULT 0.00,
    freight_charges DECIMAL(15,2) DEFAULT 0.00,
    fuel_surcharge DECIMAL(15,2) DEFAULT 0.00,
    handling_fee DECIMAL(15,2) DEFAULT 0.00,
    customs_fee DECIMAL(15,2) DEFAULT 0.00,
    insurance_fee DECIMAL(15,2) DEFAULT 0.00,
    other_fees DECIMAL(15,2) DEFAULT 0.00,
    total_charges DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    payment_date TIMESTAMP WITH TIME ZONE,
    pickup_instructions TEXT,
    delivery_instructions TEXT,
    special_instructions TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Freight Tracking table
CREATE TABLE IF NOT EXISTS freight_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES freight_bookings(id) ON DELETE CASCADE,
    carrier_id UUID NOT NULL REFERENCES carriers(id),
    tracking_number VARCHAR(100) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_description VARCHAR(500) NOT NULL,
    location VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(50),
    postal_code VARCHAR(20),
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_delivery_date TIMESTAMP WITH TIME ZONE,
    actual_delivery_date TIMESTAMP WITH TIME ZONE,
    delivered_by VARCHAR(100),
    recipient_name VARCHAR(100),
    signature_image_url VARCHAR(500),
    temperature_recorded DECIMAL(5,2),
    temperature_unit VARCHAR(10),
    humidity_recorded DECIMAL(5,2),
    humidity_unit VARCHAR(10),
    status VARCHAR(30) NOT NULL DEFAULT 'IN_TRANSIT',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Warehouse Transfers table
CREATE TABLE IF NOT EXISTS warehouse_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    transfer_date TIMESTAMP WITH TIME ZONE NOT NULL,
    from_warehouse_id UUID NOT NULL,
    from_warehouse_name VARCHAR(100) NOT NULL,
    to_warehouse_id UUID NOT NULL,
    to_warehouse_name VARCHAR(100) NOT NULL,
    transfer_type VARCHAR(50) NOT NULL DEFAULT 'INTERNAL',
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    requested_by VARCHAR(100),
    requested_at TIMESTAMP WITH TIME ZONE,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    picked_by VARCHAR(100),
    picked_at TIMESTAMP WITH TIME ZONE,
    shipped_by VARCHAR(100),
    shipped_at TIMESTAMP WITH TIME ZONE,
    received_by VARCHAR(100),
    received_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Warehouse Transfer Lines table
CREATE TABLE IF NOT EXISTS warehouse_transfer_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES warehouse_transfers(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    item_code VARCHAR(50),
    item_description TEXT,
    quantity DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    from_location_id UUID,
    from_location_name VARCHAR(100),
    to_location_id UUID,
    to_location_name VARCHAR(100),
    picked_quantity DECIMAL(15,4) DEFAULT 0.0000,
    shipped_quantity DECIMAL(15,4) DEFAULT 0.0000,
    received_quantity DECIMAL(15,4) DEFAULT 0.0000,
    damaged_quantity DECIMAL(15,4) DEFAULT 0.0000,
    lot_id UUID,
    lot_number VARCHAR(100),
    serial_id UUID,
    serial_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shipping_orders_number ON shipping_orders(shipping_order_number);
CREATE INDEX IF NOT EXISTS idx_shipping_orders_customer ON shipping_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipping_orders_status ON shipping_orders(status);
CREATE INDEX IF NOT EXISTS idx_shipping_orders_date ON shipping_orders(shipping_date);
CREATE INDEX IF NOT EXISTS idx_shipping_orders_carrier ON shipping_orders(carrier_id);
CREATE INDEX IF NOT EXISTS idx_shipping_orders_created_at ON shipping_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_shipping_orders_updated_at ON shipping_orders(updated_at);

CREATE INDEX IF NOT EXISTS idx_shipping_order_lines_order ON shipping_order_lines(shipping_order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_order_lines_item ON shipping_order_lines(item_id);
CREATE INDEX IF NOT EXISTS idx_shipping_order_lines_lot ON shipping_order_lines(lot_id);
CREATE INDEX IF NOT EXISTS idx_shipping_order_lines_serial ON shipping_order_lines(serial_id);
CREATE INDEX IF NOT EXISTS idx_shipping_order_lines_warehouse ON shipping_order_lines(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_shipping_order_lines_location ON shipping_order_lines(location_id);
CREATE INDEX IF NOT EXISTS idx_shipping_order_lines_created_at ON shipping_order_lines(created_at);

CREATE INDEX IF NOT EXISTS idx_receiving_orders_number ON receiving_orders(receiving_order_number);
CREATE INDEX IF NOT EXISTS idx_receiving_orders_supplier ON receiving_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_receiving_orders_status ON receiving_orders(status);
CREATE INDEX IF NOT EXISTS idx_receiving_orders_date ON receiving_orders(received_date);
CREATE INDEX IF NOT EXISTS idx_receiving_orders_po ON receiving_orders(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_receiving_orders_carrier ON receiving_orders(carrier_id);
CREATE INDEX IF NOT EXISTS idx_receiving_orders_created_at ON receiving_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_receiving_orders_updated_at ON receiving_orders(updated_at);

CREATE INDEX IF NOT EXISTS idx_receiving_order_lines_order ON receiving_order_lines(receiving_order_id);
CREATE INDEX IF NOT EXISTS idx_receiving_order_lines_item ON receiving_order_lines(item_id);
CREATE INDEX IF NOT EXISTS idx_receiving_order_lines_po_line ON receiving_order_lines(po_line_id);
CREATE INDEX IF NOT EXISTS idx_receiving_order_lines_warehouse ON receiving_order_lines(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_receiving_order_lines_location ON receiving_order_lines(location_id);
CREATE INDEX IF NOT EXISTS idx_receiving_order_lines_created_at ON receiving_order_lines(created_at);

CREATE INDEX IF NOT EXISTS idx_carriers_code ON carriers(carrier_code);
CREATE INDEX IF NOT EXISTS idx_carriers_name ON carriers(name);
CREATE INDEX IF NOT EXISTS idx_carriers_status ON carriers(status);
CREATE INDEX IF NOT EXISTS idx_carriers_type ON carriers(carrier_type);
CREATE INDEX IF NOT EXISTS idx_carriers_created_at ON carriers(created_at);
CREATE INDEX IF NOT EXISTS idx_carriers_updated_at ON carriers(updated_at);

CREATE INDEX IF NOT EXISTS idx_carrier_services_carrier ON carrier_services(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_services_code ON carrier_services(service_code);
CREATE INDEX IF NOT EXISTS idx_carrier_services_status ON carrier_services(status);
CREATE INDEX IF NOT EXISTS idx_carrier_services_created_at ON carrier_services(created_at);

CREATE INDEX IF NOT EXISTS idx_freight_quotes_number ON freight_quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_freight_quotes_carrier ON freight_quotes(carrier_id);
CREATE INDEX IF NOT EXISTS idx_freight_quotes_status ON freight_quotes(quote_status);
CREATE INDEX IF NOT EXISTS idx_freight_quotes_date ON freight_quotes(quoted_at);
CREATE INDEX IF NOT EXISTS idx_freight_quotes_created_at ON freight_quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_freight_quotes_updated_at ON freight_quotes(updated_at);

CREATE INDEX IF NOT EXISTS idx_freight_bookings_number ON freight_bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_freight_bookings_quote ON freight_bookings(quote_id);
CREATE INDEX IF NOT EXISTS idx_freight_bookings_carrier ON freight_bookings(carrier_id);
CREATE INDEX IF NOT EXISTS idx_freight_bookings_customer ON freight_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_freight_bookings_status ON freight_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_freight_bookings_tracking ON freight_bookings(tracking_number);
CREATE INDEX IF NOT EXISTS idx_freight_bookings_date ON freight_bookings(shipment_date);
CREATE INDEX IF NOT EXISTS idx_freight_bookings_created_at ON freight_bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_freight_bookings_updated_at ON freight_bookings(updated_at);

CREATE INDEX IF NOT EXISTS idx_freight_tracking_booking ON freight_tracking(booking_id);
CREATE INDEX IF NOT EXISTS idx_freight_tracking_carrier ON freight_tracking(carrier_id);
CREATE INDEX IF NOT EXISTS idx_freight_tracking_number ON freight_tracking(tracking_number);
CREATE INDEX IF NOT EXISTS idx_freight_tracking_type ON freight_tracking(activity_type);
CREATE INDEX IF NOT EXISTS idx_freight_tracking_status ON freight_tracking(status);
CREATE INDEX IF NOT EXISTS idx_freight_tracking_date ON freight_tracking(event_date);
CREATE INDEX IF NOT EXISTS idx_freight_tracking_created_at ON freight_tracking(created_at);

CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_number ON warehouse_transfers(transfer_number);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_from_warehouse ON warehouse_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_to_warehouse ON warehouse_transfers(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_status ON warehouse_transfers(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_date ON warehouse_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_created_at ON warehouse_transfers(created_at);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_updated_at ON warehouse_transfers(updated_at);

CREATE INDEX IF NOT EXISTS idx_warehouse_transfer_lines_transfer ON warehouse_transfer_lines(transfer_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfer_lines_item ON warehouse_transfer_lines(item_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfer_lines_from_location ON warehouse_transfer_lines(from_location_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfer_lines_to_location ON warehouse_transfer_lines(to_location_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfer_lines_lot ON warehouse_transfer_lines(lot_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfer_lines_serial ON warehouse_transfer_lines(serial_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfer_lines_created_at ON warehouse_transfer_lines(created_at);

-- Check constraints for enum values
ALTER TABLE shipping_orders 
    ADD CONSTRAINT chk_shipping_orders_status 
    CHECK (status IN ('DRAFT', 'PICKED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'));

ALTER TABLE shipping_orders 
    ADD CONSTRAINT chk_shipping_orders_type 
    CHECK (shipment_type IN ('STANDARD', 'EXPRESS', 'OVERNIGHT', 'FREIGHT'));

ALTER TABLE shipping_orders 
    ADD CONSTRAINT chk_shipping_orders_priority 
    CHECK (priority IN ('NORMAL', 'HIGH', 'URGENT', 'CRITICAL'));

ALTER TABLE shipping_orders 
    ADD CONSTRAINT chk_shipping_orders_freight_terms 
    CHECK (freight_terms IN ('PREPAID', 'COLLECT', 'THIRD_PARTY'));

ALTER TABLE shipping_orders 
    ADD CONSTRAINT chk_shipping_orders_packaging 
    CHECK (packaging_type IN ('BOX', 'PALLET', 'CRATE', 'DRUM', 'BAG'));

ALTER TABLE receiving_orders 
    ADD CONSTRAINT chk_receiving_orders_status 
    CHECK (status IN ('DRAFT', 'RECEIVED', 'INSPECTED', 'ACCEPTED', 'REJECTED', 'QUARANTINE', 'CANCELLED'));

ALTER TABLE receiving_orders 
    ADD CONSTRAINT chk_receiving_orders_type 
    CHECK (receipt_type IN ('GOODS', 'RETURN', 'TRANSFER', 'ADJUSTMENT'));

ALTER TABLE receiving_orders 
    ADD CONSTRAINT chk_receiving_orders_inspection 
    CHECK (inspection_status IN ('PENDING', 'PASSED', 'FAILED', 'QUARANTINE'));

ALTER TABLE carriers 
    ADD CONSTRAINT chk_carriers_status 
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'));

ALTER TABLE carriers 
    ADD CONSTRAINT chk_carriers_type 
    CHECK (carrier_type IN ('AIR', 'OCEAN', 'LAND', 'MULTIMODAL', 'COURIER'));

ALTER TABLE carrier_services 
    ADD CONSTRAINT chk_carrier_services_status 
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'DISCONTINUED'));

ALTER TABLE freight_quotes 
    ADD CONSTRAINT chk_freight_quotes_status 
    CHECK (quote_status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'));

ALTER TABLE freight_quotes 
    ADD CONSTRAINT chk_freight_quotes_weight_unit 
    CHECK (weight_unit IN ('KG', 'LB', 'TON'));

ALTER TABLE freight_quotes 
    ADD CONSTRAINT chk_freight_quotes_volume_unit 
    CHECK (volume_unit IN ('CBM', 'CFT', 'LITERS'));

ALTER TABLE freight_bookings 
    ADD CONSTRAINT chk_freight_bookings_status 
    CHECK (booking_status IN ('DRAFT', 'CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'));

ALTER TABLE freight_bookings 
    ADD CONSTRAINT chk_freight_bookings_payment 
    CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED'));

ALTER TABLE freight_bookings 
    ADD CONSTRAINT chk_freight_bookings_method 
    CHECK (payment_method IN ('CASH', 'CREDIT', 'DEBIT', 'NET_BANKING', 'WALLET', 'CREDIT_TERM'));

ALTER TABLE freight_tracking 
    ADD CONSTRAINT chk_freight_tracking_type 
    CHECK (activity_type IN ('PICKUP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 'RETURNED'));

ALTER TABLE freight_tracking 
    ADD CONSTRAINT chk_freight_tracking_status 
    CHECK (status IN ('IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 'RETURNED', 'CANCELLED'));

ALTER TABLE warehouse_transfers 
    ADD CONSTRAINT chk_warehouse_transfers_status 
    CHECK (status IN ('DRAFT', 'PICKED', 'SHIPPED', 'RECEIVED', 'CANCELLED'));

ALTER TABLE warehouse_transfers 
    ADD CONSTRAINT chk_warehouse_transfers_type 
    CHECK (transfer_type IN ('INTERNAL', 'CUSTOMER', 'SUPPLIER', 'RETURN'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS update_shipping_orders_updated_at ON shipping_orders;
CREATE TRIGGER update_shipping_orders_updated_at BEFORE UPDATE ON shipping_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipping_order_lines_updated_at ON shipping_order_lines;
CREATE TRIGGER update_shipping_order_lines_updated_at BEFORE UPDATE ON shipping_order_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_receiving_orders_updated_at ON receiving_orders;
CREATE TRIGGER update_receiving_orders_updated_at BEFORE UPDATE ON receiving_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_receiving_order_lines_updated_at ON receiving_order_lines;
CREATE TRIGGER update_receiving_order_lines_updated_at BEFORE UPDATE ON receiving_order_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_carriers_updated_at ON carriers;
CREATE TRIGGER update_carriers_updated_at BEFORE UPDATE ON carriers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_carrier_services_updated_at ON carrier_services;
CREATE TRIGGER update_carrier_services_updated_at BEFORE UPDATE ON carrier_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_freight_quotes_updated_at ON freight_quotes;
CREATE TRIGGER update_freight_quotes_updated_at BEFORE UPDATE ON freight_quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_freight_bookings_updated_at ON freight_bookings;
CREATE TRIGGER update_freight_bookings_updated_at BEFORE UPDATE ON freight_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_freight_tracking_updated_at ON freight_tracking;
CREATE TRIGGER update_freight_tracking_updated_at BEFORE UPDATE ON freight_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouse_transfers_updated_at ON warehouse_transfers;
CREATE TRIGGER update_warehouse_transfers_updated_at BEFORE UPDATE ON warehouse_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouse_transfer_lines_updated_at ON warehouse_transfer_lines;
CREATE TRIGGER update_warehouse_transfer_lines_updated_at BEFORE UPDATE ON warehouse_transfer_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO carriers (
    carrier_code, name, company_name, contact_person, email, phone, carrier_type, service_level, transit_time_days, base_rate, status
) VALUES 
('FEDEX', 'FedEx Express', 'Federal Express Corporation', 'John Smith', 'john.smith@fedex.com', '+1-800-463-3339', 'AIR', 'EXPRESS', 2, 50.00, 'ACTIVE'),
('UPS', 'UPS Worldwide', 'United Parcel Service', 'Jane Doe', 'jane.doe@ups.com', '+1-800-742-5877', 'AIR', 'STANDARD', 3, 45.00, 'ACTIVE'),
('DHL', 'DHL Express', 'DHL Group', 'Bob Johnson', 'bob.johnson@dhl.com', '+1-800-CALL-DHL', 'AIR', 'EXPRESS', 2, 55.00, 'ACTIVE'),
('MAERSK', 'Maersk Line', 'A.P. Moller-Maersk Group', 'Alice Brown', 'alice.brown@maersk.com', '+45 33 93 11 11', 'OCEAN', 'FCL', 14, 1000.00, 'ACTIVE'),
('BLUEDART', 'Blue Dart Express', 'Blue Dart Aviation', 'Charlie Wilson', 'charlie.wilson@bluedart.com', '+91-124-4671111', 'LAND', 'EXPRESS', 5, 30.00, 'ACTIVE');

INSERT INTO carrier_services (
    carrier_id, service_code, service_name, description, transit_time_days, delivery_hours, saturday_delivery, sunday_delivery, base_rate, status
) VALUES 
((SELECT id FROM carriers WHERE carrier_code = 'FEDEX'), 'FEDEX-EXPRESS', 'FedEx Express', 'Next day delivery service', 1, '09:00-18:00', true, false, 75.00, 'ACTIVE'),
((SELECT id FROM carriers WHERE carrier_code = 'UPS'), 'UPS-STANDARD', 'UPS Standard', '3-5 business days delivery', 4, '08:00-17:00', false, false, 40.00, 'ACTIVE'),
((SELECT id FROM carriers WHERE carrier_code = 'DHL'), 'DHL-EXPRESS', 'DHL Express Worldwide', 'International express delivery', 2, '10:00-20:00', true, true, 80.00, 'ACTIVE'),
((SELECT id FROM carriers WHERE carrier_code = 'MAERSK'), 'MAERSK-FCL', 'Maersk FCL', 'Full Container Load ocean freight', 14, 'Any time', false, false, 1200.00, 'ACTIVE'),
((SELECT id FROM carriers WHERE carrier_code = 'BLUEDART'), 'BLUEDART-EXPRESS', 'Blue Dart Express', 'Domestic express delivery', 2, '07:00-22:00', true, false, 35.00, 'ACTIVE');

-- Comments for documentation
COMMENT ON TABLE shipping_orders IS 'Shipping orders for outbound shipments to customers';
COMMENT ON TABLE shipping_order_lines IS 'Line items for shipping orders with lot/serial tracking';
COMMENT ON TABLE receiving_orders IS 'Receiving orders for inbound shipments from suppliers';
COMMENT ON TABLE receiving_order_lines IS 'Line items for receiving orders with QC and putaway details';
COMMENT ON TABLE carriers IS 'Master data for transportation carriers';
COMMENT ON TABLE carrier_services IS 'Available services for each carrier';
COMMENT ON TABLE freight_quotes IS 'Freight quotes from carriers';
COMMENT ON TABLE freight_bookings IS 'Booked freight shipments';
COMMENT ON TABLE freight_tracking IS 'Real-time tracking information for shipments';
COMMENT ON TABLE warehouse_transfers IS 'Internal warehouse transfer orders';
COMMENT ON TABLE warehouse_transfer_lines IS 'Line items for warehouse transfers';

COMMENT ON COLUMN shipping_orders.shipping_order_number IS 'Unique identifier for the shipping order';
COMMENT ON COLUMN receiving_orders.receiving_order_number IS 'Unique identifier for the receiving order';
COMMENT ON COLUMN carriers.carrier_code IS 'Unique identifier for the carrier';
COMMENT ON COLUMN freight_quotes.quote_number IS 'Unique identifier for the freight quote';
COMMENT ON COLUMN freight_bookings.booking_number IS 'Unique identifier for the freight booking';
COMMENT ON COLUMN warehouse_transfers.transfer_number IS 'Unique identifier for the warehouse transfer';

-- Log migration completion
INSERT INTO user_audit_log (user_id, action, resource_type, resource_id, request_data, response_data, created_at) 
VALUES (
    (SELECT id FROM users WHERE username = 'admin'), 
    'MIGRATION', 
    'DATABASE', 
    'V8__create_logistics_tables.sql', 
    '{"tables": ["shipping_orders", "shipping_order_lines", "receiving_orders", "receiving_order_lines", "carriers", "carrier_services", "freight_quotes", "freight_bookings", "freight_tracking", "warehouse_transfers", "warehouse_transfer_lines"]}', 
    '{"status": "COMPLETED", "records_inserted": 10}', 
    NOW()
);

-- Display completion message
SELECT 'Logistics module tables created successfully with sample data' AS migration_status;