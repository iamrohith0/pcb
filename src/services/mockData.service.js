/**
 * Mock Data Service
 * Provides mock data for testing RFQ and Invoice functionality
 * This can be removed once real API endpoints are available
 */

// Mock RFQ data
const mockRFQs = [
  {
    id: "rfq-001",
    rfq_no: "RFQ-2026-001",
    rfq_date: "2026-01-05",
    status: "Open",
    priority: "Normal",
    customer: {
      id: "cust-001",
      name: "Tech Solutions Ltd",
      contact_name: "John Smith",
      email: "john.smith@techsolutions.com",
      phone: "+91 98765 43210"
    },
    currency: "INR",
    total_qty: 1000,
    lines_count: 2,
    max_layers: 4,
    lines: [
      {
        id: "line-001",
        pcb_type: "FR4",
        layers: 2,
        thickness_mm: 1.6,
        copper_oz: 1,
        finish: "HASL",
        solder_mask: "Green",
        silkscreen: "White",
        panelization: "Customer",
        qty: 500,
        unit: "PCS",
        delivery_days: 7,
        notes: "Standard FR4 with ENIG finish"
      },
      {
        id: "line-002", 
        pcb_type: "FR4",
        layers: 4,
        thickness_mm: 1.6,
        copper_oz: 1,
        finish: "ENIG",
        solder_mask: "Blue",
        silkscreen: "White",
        panelization: "Factory",
        qty: 500,
        unit: "PCS",
        delivery_days: 10,
        notes: "4-layer with ENIG finish"
      }
    ],
    special_instructions: "Please provide DFM report",
    attachments: [],
    created_at: "2026-01-05T10:00:00Z",
    updated_at: "2026-01-05T10:00:00Z"
  },
  {
    id: "rfq-002",
    rfq_no: "RFQ-2026-002",
    rfq_date: "2026-01-04",
    status: "Quoted",
    priority: "High",
    customer: {
      id: "cust-002",
      name: "Electronics India Pvt Ltd",
      contact_name: "Sarah Johnson",
      email: "sarah.j@electronics.in",
      phone: "+91 87654 32109"
    },
    currency: "INR",
    total_qty: 2000,
    lines_count: 1,
    max_layers: 6,
    lines: [
      {
        id: "line-003",
        pcb_type: "Rigid-Flex",
        layers: 6,
        thickness_mm: 0.8,
        copper_oz: 0.5,
        finish: "Immersion Gold",
        solder_mask: "Black",
        silkscreen: "White",
        panelization: "Not Required",
        qty: 2000,
        unit: "PCS",
        delivery_days: 15,
        notes: "Rigid-flex with controlled impedance"
      }
    ],
    special_instructions: "Need impedance control documentation",
    attachments: [],
    created_at: "2026-01-04T14:30:00Z",
    updated_at: "2026-01-04T14:30:00Z"
  }
];

// Mock Invoice data
const mockInvoices = [
  {
    id: "inv-001",
    invoice_no: "INV-2026-001",
    invoice_date: "2026-01-05",
    due_date: "2026-02-05",
    status: "SENT",
    customer: {
      id: "cust-001",
      name: "Tech Solutions Ltd",
      gstin: "27AABCCDDEEFFG",
      billing_address: {
        name: "Tech Solutions Ltd",
        address_line1: "123 Tech Park",
        address_line2: "Electronic City",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560100",
        country: "India"
      },
      shipping_address: {
        name: "Tech Solutions Ltd",
        address_line1: "123 Tech Park",
        address_line2: "Electronic City", 
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560100",
        country: "India"
      }
    },
    currency: "INR",
    place_of_supply: "Karnataka",
    items: [
      {
        id: "item-001",
        description: "2-Layer FR4 PCB 1.6mm HASL",
        hsn: "8534",
        qty: 500,
        uom: "PCS",
        unit_price: 25.00,
        discount_pct: 0,
        tax_pct: 18
      },
      {
        id: "item-002",
        description: "4-Layer FR4 PCB 1.6mm ENIG",
        hsn: "8534",
        qty: 500,
        uom: "PCS",
        unit_price: 45.00,
        discount_pct: 5,
        tax_pct: 18
      }
    ],
    charges: {
      packing: 500.00,
      shipping: 1000.00,
      other: 0.00
    },
    tcs_pct: 0,
    rounding: 0,
    notes: "Goods once sold will not be taken back",
    terms: "Subject to Bengaluru jurisdiction",
    totals: {
      sub_total: 32500.00,
      discount_total: 1125.00,
      taxable_total: 31375.00,
      tax_total: 5647.50,
      charge_total: 1500.00,
      tcs: 0,
      rounding: 0,
      grand_total: 38522.50
    },
    created_at: "2026-01-05T11:00:00Z",
    updated_at: "2026-01-05T11:00:00Z"
  },
  {
    id: "inv-002",
    invoice_no: "INV-2026-002",
    invoice_date: "2026-01-04",
    due_date: "2026-01-14",
    status: "PAID",
    customer: {
      id: "cust-002",
      name: "Electronics India Pvt Ltd",
      gstin: "27XYZABCDEF12",
      billing_address: {
        name: "Electronics India Pvt Ltd",
        address_line1: "456 Industrial Area",
        address_line2: "Phase 2",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411014",
        country: "India"
      },
      shipping_address: {
        name: "Electronics India Pvt Ltd",
        address_line1: "456 Industrial Area",
        address_line2: "Phase 2",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411014",
        country: "India"
      }
    },
    currency: "INR",
    place_of_supply: "Maharashtra",
    items: [
      {
        id: "item-003",
        description: "6-Layer Rigid-Flex PCB 0.8mm Immersion Gold",
        hsn: "8534",
        qty: 2000,
        uom: "PCS",
        unit_price: 120.00,
        discount_pct: 0,
        tax_pct: 18
      }
    ],
    charges: {
      packing: 2000.00,
      shipping: 3000.00,
      other: 500.00
    },
    tcs_pct: 0.1,
    rounding: 0,
    notes: "Rigid-flex with controlled impedance",
    terms: "Subject to Pune jurisdiction",
    totals: {
      sub_total: 240000.00,
      discount_total: 0,
      taxable_total: 240000.00,
      tax_total: 43200.00,
      charge_total: 5500.00,
      tcs: 288.50,
      rounding: 0,
      grand_total: 288988.50
    },
    created_at: "2026-01-04T16:00:00Z",
    updated_at: "2026-01-04T16:00:00Z"
  }
];

// Mock Customer data
const mockCustomers = [
  {
    id: "cust-001",
    name: "Tech Solutions Ltd",
    company_name: "Tech Solutions Ltd",
    email: "john.smith@techsolutions.com",
    phone: "+91 98765 43210",
    gstin: "27AABCCDDEEFFG",
    status: "Active",
    billing: {
      address_line1: "123 Tech Park",
      address_line2: "Electronic City",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560100",
      country: "India"
    },
    shipping: {
      address_line1: "123 Tech Park",
      address_line2: "Electronic City",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560100",
      country: "India"
    },
    credit: {
      payment_terms_days: 30
    }
  },
  {
    id: "cust-002",
    name: "Electronics India Pvt Ltd",
    company_name: "Electronics India Pvt Ltd",
    email: "sarah.j@electronics.in",
    phone: "+91 87654 32109",
    gstin: "27XYZABCDEF12",
    status: "Active",
    billing: {
      address_line1: "456 Industrial Area",
      address_line2: "Phase 2",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411014",
      country: "India"
    },
    shipping: {
      address_line1: "456 Industrial Area",
      address_line2: "Phase 2",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411014",
      country: "India"
    },
    credit: {
      payment_terms_days: 10
    }
  }
];

class MockDataService {
  // RFQ Methods
  async getRFQs(params = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filtered = [...mockRFQs];
        
        if (params.q) {
          const q = params.q.toLowerCase();
          filtered = filtered.filter(rfq => 
            rfq.rfq_no.toLowerCase().includes(q) ||
            rfq.customer.name.toLowerCase().includes(q) ||
            rfq.customer.contact_name.toLowerCase().includes(q) ||
            rfq.status.toLowerCase().includes(q)
          );
        }
        
        if (params.status && params.status !== 'all') {
          filtered = filtered.filter(rfq => rfq.status.toLowerCase() === params.status.toLowerCase());
        }
        
        resolve({
          data: {
            rfqs: filtered,
            meta: {
              page: 1,
              limit: 20,
              total: filtered.length,
              totalPages: 1
            }
          }
        });
      }, 500);
    });
  }

  async getRFQ(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rfq = mockRFQs.find(r => r.id === id);
        if (rfq) {
          resolve({ data: rfq });
        } else {
          reject({ response: { data: { message: "RFQ not found" } } });
        }
      }, 300);
    });
  }

  async createRFQ(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newRFQ = {
          id: `rfq-${Date.now()}`,
          rfq_no: data.rfq_no || `RFQ-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
          rfq_date: data.rfq_date,
          status: "Open",
          priority: data.priority || "Normal",
          customer: data.customer || { name: data.customer_name },
          currency: data.currency || "INR",
          total_qty: data.lines?.reduce((sum, line) => sum + (line.qty || 0), 0) || 0,
          lines_count: data.lines?.length || 0,
          max_layers: Math.max(...(data.lines?.map(line => line.layers) || [2])),
          lines: data.lines || [],
          special_instructions: data.special_instructions,
          attachments: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        mockRFQs.unshift(newRFQ);
        resolve({ data: newRFQ });
      }, 500);
    });
  }

  async updateRFQ(id, data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockRFQs.findIndex(r => r.id === id);
        if (index !== -1) {
          mockRFQs[index] = {
            ...mockRFQs[index],
            ...data,
            updated_at: new Date().toISOString()
          };
          resolve({ data: mockRFQs[index] });
        } else {
          reject({ response: { data: { message: "RFQ not found" } } });
        }
      }, 300);
    });
  }

  async deleteRFQ(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockRFQs.findIndex(r => r.id === id);
        if (index !== -1) {
          mockRFQs.splice(index, 1);
          resolve({ data: { message: "RFQ deleted successfully" } });
        } else {
          reject({ response: { data: { message: "RFQ not found" } } });
        }
      }, 300);
    });
  }

  // Invoice Methods
  async getInvoices(params = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filtered = [...mockInvoices];
        
        if (params.q) {
          const q = params.q.toLowerCase();
          filtered = filtered.filter(inv => 
            inv.invoice_no.toLowerCase().includes(q) ||
            inv.customer.name.toLowerCase().includes(q) ||
            inv.status.toLowerCase().includes(q)
          );
        }
        
        if (params.status && params.status !== 'all') {
          filtered = filtered.filter(inv => inv.status.toLowerCase() === params.status.toLowerCase());
        }
        
        if (params.from) {
          filtered = filtered.filter(inv => new Date(inv.invoice_date) >= new Date(params.from));
        }
        
        if (params.to) {
          filtered = filtered.filter(inv => new Date(inv.invoice_date) <= new Date(params.to));
        }
        
        // Sort
        if (params.sortBy) {
          filtered.sort((a, b) => {
            const aVal = a[params.sortBy];
            const bVal = b[params.sortBy];
            if (params.sortDir === 'desc') {
              return aVal < bVal ? 1 : -1;
            } else {
              return aVal > bVal ? 1 : -1;
            }
          });
        }
        
        resolve({
          data: {
            data: filtered,
            meta: {
              page: 1,
              limit: 20,
              total: filtered.length,
              totalPages: 1
            }
          }
        });
      }, 500);
    });
  }

  async getInvoice(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const invoice = mockInvoices.find(inv => inv.id === id);
        if (invoice) {
          resolve({ data: invoice });
        } else {
          reject({ response: { data: { message: "Invoice not found" } } });
        }
      }, 300);
    });
  }

  async createInvoice(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newInvoice = {
          id: `inv-${Date.now()}`,
          invoice_no: data.invoiceNo || `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
          invoice_date: data.invoiceDate,
          due_date: data.dueDate,
          status: "DRAFT",
          customer: data.customer || { name: data.billing.name },
          currency: data.currency || "INR",
          place_of_supply: data.placeOfSupply,
          items: data.items || [],
          charges: data.charges || { packing: 0, shipping: 0, other: 0 },
          tcs_pct: data.tcsPct || 0,
          rounding: data.rounding || 0,
          notes: data.notes,
          terms: data.terms,
          totals: data.totals || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        mockInvoices.unshift(newInvoice);
        resolve({ data: newInvoice });
      }, 500);
    });
  }

  async updateInvoice(id, data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockInvoices.findIndex(inv => inv.id === id);
        if (index !== -1) {
          mockInvoices[index] = {
            ...mockInvoices[index],
            ...data,
            updated_at: new Date().toISOString()
          };
          resolve({ data: mockInvoices[index] });
        } else {
          reject({ response: { data: { message: "Invoice not found" } } });
        }
      }, 300);
    });
  }

  async deleteInvoice(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockInvoices.findIndex(inv => inv.id === id);
        if (index !== -1) {
          mockInvoices.splice(index, 1);
          resolve({ data: { message: "Invoice deleted successfully" } });
        } else {
          reject({ response: { data: { message: "Invoice not found" } } });
        }
      }, 300);
    });
  }

  // Customer Methods
  async getCustomers(params = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filtered = [...mockCustomers];
        
        if (params.q) {
          const q = params.q.toLowerCase();
          filtered = filtered.filter(cust => 
            cust.name.toLowerCase().includes(q) ||
            cust.company_name.toLowerCase().includes(q) ||
            cust.email.toLowerCase().includes(q) ||
            cust.phone.toLowerCase().includes(q)
          );
        }
        
        resolve({
          data: {
            data: filtered,
            meta: {
              page: 1,
              limit: 50,
              total: filtered.length,
              totalPages: 1
            }
          }
        });
      }, 300);
    });
  }

  async getCustomer(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const customer = mockCustomers.find(c => c.id === id);
        if (customer) {
          resolve({ data: customer });
        } else {
          reject({ response: { data: { message: "Customer not found" } } });
        }
      }, 200);
    });
  }
}

export default new MockDataService();