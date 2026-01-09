-- Sales module schema (RFQ, Quotation, Sales Order, Invoice)
-- Assumes update_updated_at_column() is available from earlier migrations.

-- RFQs (Request for Quotation)
CREATE TABLE sales_rfqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_no VARCHAR(50) UNIQUE NOT NULL,
    rfq_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Open',
    priority VARCHAR(20) NOT NULL DEFAULT 'Normal',
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(200),
    contact_name VARCHAR(150),
    contact_email VARCHAR(150),
    contact_phone VARCHAR(30),

    total_qty INTEGER DEFAULT 0,
    lines_count INTEGER DEFAULT 0,
    max_layers INTEGER DEFAULT 0,
    special_instructions TEXT,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sales_rfq_total_qty CHECK (total_qty IS NULL OR total_qty >= 0),
    CONSTRAINT chk_sales_rfq_lines_count CHECK (lines_count IS NULL OR lines_count >= 0),
    CONSTRAINT chk_sales_rfq_max_layers CHECK (max_layers IS NULL OR max_layers >= 0)
);

CREATE INDEX idx_sales_rfqs_rfq_no ON sales_rfqs(rfq_no);
CREATE INDEX idx_sales_rfqs_status ON sales_rfqs(status);
CREATE INDEX idx_sales_rfqs_customer_id ON sales_rfqs(customer_id);
CREATE INDEX idx_sales_rfqs_rfq_date ON sales_rfqs(rfq_date);

CREATE TRIGGER update_sales_rfqs_updated_at
    BEFORE UPDATE ON sales_rfqs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE sales_rfq_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id UUID NOT NULL REFERENCES sales_rfqs(id) ON DELETE CASCADE,
    line_no INTEGER,
    pcb_type VARCHAR(50),
    layers INTEGER,
    thickness_mm DECIMAL(6,3),
    copper_oz DECIMAL(6,3),
    finish VARCHAR(50),
    solder_mask VARCHAR(50),
    silkscreen VARCHAR(50),
    panelization VARCHAR(50),
    qty INTEGER,
    unit VARCHAR(20),
    delivery_days INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sales_rfq_line_qty CHECK (qty IS NULL OR qty >= 0),
    CONSTRAINT chk_sales_rfq_line_layers CHECK (layers IS NULL OR layers >= 0),
    CONSTRAINT chk_sales_rfq_line_delivery_days CHECK (delivery_days IS NULL OR delivery_days >= 0)
);

CREATE INDEX idx_sales_rfq_lines_rfq_id ON sales_rfq_lines(rfq_id);
CREATE INDEX idx_sales_rfq_lines_line_no ON sales_rfq_lines(line_no);

CREATE TRIGGER update_sales_rfq_lines_updated_at
    BEFORE UPDATE ON sales_rfq_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Quotations
CREATE TABLE sales_quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_no VARCHAR(50) UNIQUE NOT NULL,
    quote_date DATE NOT NULL,
    valid_until DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    incoterms VARCHAR(50),
    lead_time VARCHAR(100),
    payment_terms VARCHAR(100),
    remarks TEXT,
    rfq_id UUID REFERENCES sales_rfqs(id) ON DELETE SET NULL,
    rfq_ref VARCHAR(50),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    internal_note TEXT,

    pcb_job_name VARCHAR(150),
    pcb_board_type VARCHAR(50),
    pcb_layer_count INTEGER,
    pcb_thickness VARCHAR(50),
    pcb_copper_weight VARCHAR(50),
    pcb_surface_finish VARCHAR(50),
    pcb_solder_mask VARCHAR(50),
    pcb_silkscreen VARCHAR(50),
    pcb_impedance_control VARCHAR(50),
    pcb_via_type VARCHAR(50),
    pcb_panelization VARCHAR(50),

    sub_total DECIMAL(15,2),
    discount_total DECIMAL(15,2),
    tax_total DECIMAL(15,2),
    grand_total DECIMAL(15,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sales_quote_sub_total CHECK (sub_total IS NULL OR sub_total >= 0),
    CONSTRAINT chk_sales_quote_discount_total CHECK (discount_total IS NULL OR discount_total >= 0),
    CONSTRAINT chk_sales_quote_tax_total CHECK (tax_total IS NULL OR tax_total >= 0),
    CONSTRAINT chk_sales_quote_grand_total CHECK (grand_total IS NULL OR grand_total >= 0)
);

CREATE INDEX idx_sales_quotations_quote_no ON sales_quotations(quote_no);
CREATE INDEX idx_sales_quotations_status ON sales_quotations(status);
CREATE INDEX idx_sales_quotations_customer_id ON sales_quotations(customer_id);
CREATE INDEX idx_sales_quotations_quote_date ON sales_quotations(quote_date);

CREATE TRIGGER update_sales_quotations_updated_at
    BEFORE UPDATE ON sales_quotations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE sales_quotation_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES sales_quotations(id) ON DELETE CASCADE,
    description TEXT,
    hsn VARCHAR(30),
    qty INTEGER,
    unit_price DECIMAL(15,2),
    discount_pct DECIMAL(6,2),
    cgst DECIMAL(6,2),
    sgst DECIMAL(6,2),
    igst DECIMAL(6,2),
    spec TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sales_quote_line_qty CHECK (qty IS NULL OR qty >= 0),
    CONSTRAINT chk_sales_quote_line_unit_price CHECK (unit_price IS NULL OR unit_price >= 0),
    CONSTRAINT chk_sales_quote_line_discount_pct CHECK (discount_pct IS NULL OR discount_pct >= 0),
    CONSTRAINT chk_sales_quote_line_cgst CHECK (cgst IS NULL OR cgst >= 0),
    CONSTRAINT chk_sales_quote_line_sgst CHECK (sgst IS NULL OR sgst >= 0),
    CONSTRAINT chk_sales_quote_line_igst CHECK (igst IS NULL OR igst >= 0)
);

CREATE INDEX idx_sales_quotation_lines_quotation_id ON sales_quotation_lines(quotation_id);

CREATE TRIGGER update_sales_quotation_lines_updated_at
    BEFORE UPDATE ON sales_quotation_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sales Orders
CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(50) UNIQUE NOT NULL,
    order_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    contact_name VARCHAR(150),
    contact_phone VARCHAR(30),
    contact_email VARCHAR(150),

    po_number VARCHAR(50),
    po_date DATE,

    job_name VARCHAR(150),
    job_priority VARCHAR(30),
    requested_delivery DATE,

    shipping_name VARCHAR(150),
    shipping_address_line1 VARCHAR(200),
    shipping_address_line2 VARCHAR(200),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_pincode VARCHAR(10),
    shipping_country VARCHAR(50) DEFAULT 'India',
    shipping_gstin VARCHAR(20),

    billing_name VARCHAR(150),
    billing_address_line1 VARCHAR(200),
    billing_address_line2 VARCHAR(200),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_pincode VARCHAR(10),
    billing_country VARCHAR(50) DEFAULT 'India',
    billing_gstin VARCHAR(20),

    notes TEXT,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,

    sub_total DECIMAL(15,2),
    tax_total DECIMAL(15,2),
    grand_total DECIMAL(15,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sales_order_sub_total CHECK (sub_total IS NULL OR sub_total >= 0),
    CONSTRAINT chk_sales_order_tax_total CHECK (tax_total IS NULL OR tax_total >= 0),
    CONSTRAINT chk_sales_order_grand_total CHECK (grand_total IS NULL OR grand_total >= 0)
);

CREATE INDEX idx_sales_orders_order_no ON sales_orders(order_no);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_order_date ON sales_orders(order_date);

CREATE TRIGGER update_sales_orders_updated_at
    BEFORE UPDATE ON sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    sku VARCHAR(100),
    description TEXT,
    qty INTEGER,
    uom VARCHAR(20),
    unit_price DECIMAL(15,2),
    tax_pct DECIMAL(6,2),
    lead_time_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sales_order_item_qty CHECK (qty IS NULL OR qty >= 0),
    CONSTRAINT chk_sales_order_item_unit_price CHECK (unit_price IS NULL OR unit_price >= 0),
    CONSTRAINT chk_sales_order_item_tax_pct CHECK (tax_pct IS NULL OR tax_pct >= 0),
    CONSTRAINT chk_sales_order_item_lead_time CHECK (lead_time_days IS NULL OR lead_time_days >= 0)
);

CREATE INDEX idx_sales_order_items_order_id ON sales_order_items(order_id);

CREATE TRIGGER update_sales_order_items_updated_at
    BEFORE UPDATE ON sales_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Invoices
CREATE TABLE sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    source_type VARCHAR(30),
    source_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    place_of_supply VARCHAR(100),

    billing_name VARCHAR(150),
    billing_address_line1 VARCHAR(200),
    billing_address_line2 VARCHAR(200),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_pincode VARCHAR(10),
    billing_country VARCHAR(50) DEFAULT 'India',
    billing_gstin VARCHAR(20),

    shipping_name VARCHAR(150),
    shipping_address_line1 VARCHAR(200),
    shipping_address_line2 VARCHAR(200),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_pincode VARCHAR(10),
    shipping_country VARCHAR(50) DEFAULT 'India',
    shipping_gstin VARCHAR(20),

    charges_packing DECIMAL(15,2) DEFAULT 0,
    charges_shipping DECIMAL(15,2) DEFAULT 0,
    charges_other DECIMAL(15,2) DEFAULT 0,
    tcs_pct DECIMAL(6,2) DEFAULT 0,
    rounding DECIMAL(15,2) DEFAULT 0,

    notes TEXT,
    terms TEXT,

    sub_total DECIMAL(15,2),
    discount_total DECIMAL(15,2),
    taxable_total DECIMAL(15,2),
    tax_total DECIMAL(15,2),
    charge_total DECIMAL(15,2),
    tcs DECIMAL(15,2),
    rounding_total DECIMAL(15,2),
    grand_total DECIMAL(15,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sales_invoice_sub_total CHECK (sub_total IS NULL OR sub_total >= 0),
    CONSTRAINT chk_sales_invoice_discount_total CHECK (discount_total IS NULL OR discount_total >= 0),
    CONSTRAINT chk_sales_invoice_taxable_total CHECK (taxable_total IS NULL OR taxable_total >= 0),
    CONSTRAINT chk_sales_invoice_tax_total CHECK (tax_total IS NULL OR tax_total >= 0),
    CONSTRAINT chk_sales_invoice_charge_total CHECK (charge_total IS NULL OR charge_total >= 0),
    CONSTRAINT chk_sales_invoice_tcs CHECK (tcs IS NULL OR tcs >= 0),
    CONSTRAINT chk_sales_invoice_rounding_total CHECK (rounding_total IS NULL OR rounding_total >= 0),
    CONSTRAINT chk_sales_invoice_grand_total CHECK (grand_total IS NULL OR grand_total >= 0)
);

CREATE INDEX idx_sales_invoices_invoice_no ON sales_invoices(invoice_no);
CREATE INDEX idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX idx_sales_invoices_customer_id ON sales_invoices(customer_id);
CREATE INDEX idx_sales_invoices_invoice_date ON sales_invoices(invoice_date);

CREATE TRIGGER update_sales_invoices_updated_at
    BEFORE UPDATE ON sales_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE sales_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    description TEXT,
    hsn VARCHAR(30),
    qty INTEGER,
    uom VARCHAR(20),
    unit_price DECIMAL(15,2),
    discount_pct DECIMAL(6,2),
    tax_pct DECIMAL(6,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sales_invoice_item_qty CHECK (qty IS NULL OR qty >= 0),
    CONSTRAINT chk_sales_invoice_item_unit_price CHECK (unit_price IS NULL OR unit_price >= 0),
    CONSTRAINT chk_sales_invoice_item_discount_pct CHECK (discount_pct IS NULL OR discount_pct >= 0),
    CONSTRAINT chk_sales_invoice_item_tax_pct CHECK (tax_pct IS NULL OR tax_pct >= 0)
);

CREATE INDEX idx_sales_invoice_items_invoice_id ON sales_invoice_items(invoice_id);

CREATE TRIGGER update_sales_invoice_items_updated_at
    BEFORE UPDATE ON sales_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
