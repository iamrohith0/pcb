-- PCBxpress ERP - Procurement Module Database Migration
-- Creates tables for suppliers, purchase orders, GRNs, and supplier pricing

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    company_name VARCHAR(200),
    email VARCHAR(150),
    phone VARCHAR(20),
    website VARCHAR(200),
    gstin VARCHAR(20),
    pan VARCHAR(15),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    contact_person VARCHAR(150),
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(50),
    lead_time_days INTEGER,
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(15,2),
    currency VARCHAR(5) DEFAULT 'INR',
    preferred_payment_method VARCHAR(50),
    bank_name VARCHAR(100),
    bank_account_no VARCHAR(50),
    bank_ifsc VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Purchase Orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    po_date TIMESTAMP WITH TIME ZONE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    supplier_name VARCHAR(200) NOT NULL,
    supplier_code VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    currency VARCHAR(5) DEFAULT 'INR',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0,
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    shipping_amount DECIMAL(15,2) DEFAULT 0.00,
    grand_total DECIMAL(15,2) DEFAULT 0.00,
    payment_terms VARCHAR(100),
    delivery_date TIMESTAMP WITH TIME ZONE,
    delivery_address TEXT,
    notes TEXT,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    sent_to_supplier_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Purchase Order Lines table
CREATE TABLE IF NOT EXISTS purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    item_code VARCHAR(50),
    item_description TEXT,
    quantity DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    unit_price DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    discount_percent DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    tax_percent DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    line_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    received_quantity DECIMAL(15,4) DEFAULT 0.0000,
    pending_quantity DECIMAL(15,4) DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- GRNs (Goods Receipt Notes) table
CREATE TABLE IF NOT EXISTS grns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_number VARCHAR(50) UNIQUE NOT NULL,
    grn_date TIMESTAMP WITH TIME ZONE NOT NULL,
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    po_number VARCHAR(50),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    supplier_name VARCHAR(200) NOT NULL,
    supplier_code VARCHAR(50),
    warehouse_id UUID NOT NULL,
    warehouse_name VARCHAR(100) NOT NULL,
    vehicle_number VARCHAR(20),
    driver_name VARCHAR(100),
    driver_contact VARCHAR(20),
    received_by VARCHAR(100),
    received_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
    total_quantity DECIMAL(15,4) DEFAULT 0.0000,
    total_value DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT,
    qc_required BOOLEAN NOT NULL DEFAULT true,
    qc_passed_at TIMESTAMP WITH TIME ZONE,
    qc_failed_at TIMESTAMP WITH TIME ZONE,
    qc_remarks TEXT,
    putaway_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- GRN Lines table
CREATE TABLE IF NOT EXISTS grn_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id UUID NOT NULL REFERENCES grns(id) ON DELETE CASCADE,
    po_line_id UUID NOT NULL,
    item_id UUID NOT NULL,
    item_code VARCHAR(50),
    item_description TEXT,
    po_quantity DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    received_quantity DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    accepted_quantity DECIMAL(15,4) DEFAULT 0.0000,
    rejected_quantity DECIMAL(15,4) DEFAULT 0.0000,
    unit_price DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    line_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    batch_number VARCHAR(100),
    expiry_date TIMESTAMP WITH TIME ZONE,
    qc_status VARCHAR(30) DEFAULT 'PENDING',
    qc_remarks TEXT,
    putaway_location VARCHAR(100),
    putaway_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Supplier Pricing table
CREATE TABLE IF NOT EXISTS supplier_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_name VARCHAR(200),
    supplier_code VARCHAR(50),
    item_id UUID NOT NULL,
    item_code VARCHAR(50),
    item_description TEXT,
    currency VARCHAR(5) DEFAULT 'INR',
    unit_price DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    moq DECIMAL(15,4) DEFAULT 1.0000,
    lead_time_days INTEGER,
    effective_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_name ON suppliers(company_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_gstin ON suppliers(gstin);
CREATE INDEX IF NOT EXISTS idx_suppliers_pan ON suppliers(pan);
CREATE INDEX IF NOT EXISTS idx_suppliers_city ON suppliers(city);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON suppliers(created_at);
CREATE INDEX IF NOT EXISTS idx_suppliers_updated_at ON suppliers(updated_at);

CREATE INDEX IF NOT EXISTS idx_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_date ON purchase_orders(po_date);
CREATE INDEX IF NOT EXISTS idx_po_created_at ON purchase_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_po_updated_at ON purchase_orders(updated_at);

CREATE INDEX IF NOT EXISTS idx_pol_po_id ON purchase_order_lines(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_pol_item_id ON purchase_order_lines(item_id);
CREATE INDEX IF NOT EXISTS idx_pol_created_at ON purchase_order_lines(created_at);

CREATE INDEX IF NOT EXISTS idx_grn_number ON grns(grn_number);
CREATE INDEX IF NOT EXISTS idx_grn_po ON grns(po_id);
CREATE INDEX IF NOT EXISTS idx_grn_supplier ON grns(supplier_id);
CREATE INDEX IF NOT EXISTS idx_grn_status ON grns(status);
CREATE INDEX IF NOT EXISTS idx_grn_received_date ON grns(received_at);
CREATE INDEX IF NOT EXISTS idx_grn_created_at ON grns(created_at);
CREATE INDEX IF NOT EXISTS idx_grn_updated_at ON grns(updated_at);

CREATE INDEX IF NOT EXISTS idx_grnl_grn_id ON grn_lines(grn_id);
CREATE INDEX IF NOT EXISTS idx_grnl_po_line_id ON grn_lines(po_line_id);
CREATE INDEX IF NOT EXISTS idx_grnl_item_id ON grn_lines(item_id);
CREATE INDEX IF NOT EXISTS idx_grnl_created_at ON grn_lines(created_at);

CREATE INDEX IF NOT EXISTS idx_sp_supplier_item ON supplier_pricing(supplier_id, item_id);
CREATE INDEX IF NOT EXISTS idx_sp_item ON supplier_pricing(item_id);
CREATE INDEX IF NOT EXISTS idx_sp_supplier ON supplier_pricing(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sp_effective_date ON supplier_pricing(effective_date);
CREATE INDEX IF NOT EXISTS idx_sp_status ON supplier_pricing(status);
CREATE INDEX IF NOT EXISTS idx_sp_created_at ON supplier_pricing(created_at);
CREATE INDEX IF NOT EXISTS idx_sp_updated_at ON supplier_pricing(updated_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_order_lines_updated_at ON purchase_order_lines;
CREATE TRIGGER update_purchase_order_lines_updated_at BEFORE UPDATE ON purchase_order_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grns_updated_at ON grns;
CREATE TRIGGER update_grns_updated_at BEFORE UPDATE ON grns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grn_lines_updated_at ON grn_lines;
CREATE TRIGGER update_grn_lines_updated_at BEFORE UPDATE ON grn_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_supplier_pricing_updated_at ON supplier_pricing;
CREATE TRIGGER update_supplier_pricing_updated_at BEFORE UPDATE ON supplier_pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE suppliers IS 'Master data for suppliers/vendors';
COMMENT ON TABLE purchase_orders IS 'Purchase orders issued to suppliers';
COMMENT ON TABLE purchase_order_lines IS 'Line items for purchase orders';
COMMENT ON TABLE grns IS 'Goods Receipt Notes for received items';
COMMENT ON TABLE grn_lines IS 'Line items for GRNs with QC and putaway details';
COMMENT ON TABLE supplier_pricing IS 'Supplier-specific pricing for items';