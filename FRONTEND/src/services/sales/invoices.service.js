import axios from "@/lib/axios";

/**
 * Invoices Service
 * Handles API calls for Invoice functionality
 */
const invoicesService = {
  /**
   * Get list of invoices with optional filters
   */
  async list(params = {}) {
    try {
      const response = await axios.get("/sales/invoices", { params });
      return response;
    } catch (error) {
      console.error("Invoice API not available:", error);
      throw error;
    }
  },

  /**
   * Get next available invoice number
   */
  async getNextNumber() {
    try {
      const response = await axios.get("/sales/invoices/next-number");
      return response;
    } catch (error) {
      console.warn("Invoice next number API not available, using mock:", error);
      return {
        data: {
          next: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`
        }
      };
    }
  },

  /**
   * Create a new invoice
   */
  async create(data) {
    try {
      const response = await axios.post("/sales/invoices", data);
      return response;
    } catch (error) {
      console.error("Invoice create API not available:", error);
      throw error;
    }
  },

  /**
   * Get invoice by ID
   */
  async get(id) {
    try {
      const response = await axios.get(`/sales/invoices/${id}`);
      return response;
    } catch (error) {
      console.error("Invoice get API not available:", error);
      throw error;
    }
  },

  /**
   * Get invoice by ID (alias)
   */
  async getById(id) {
    return this.get(id);
  },

  /**
   * Update invoice
   */
  async update(id, data) {
    try {
      const response = await axios.put(`/sales/invoices/${id}`, data);
      return response;
    } catch (error) {
      console.error("Invoice update API not available:", error);
      throw error;
    }
  },

  /**
   * Delete invoice
   */
  async remove(id) {
    try {
      const response = await axios.delete(`/sales/invoices/${id}`);
      return response;
    } catch (error) {
      console.error("Invoice delete API not available:", error);
      throw error;
    }
  },

  /**
   * Export invoices to CSV
   */
  async exportCsv(params = {}) {
    try {
      const response = await axios.get("/sales/invoices/export/csv", {
        params,
        responseType: "blob",
      });
      return response;
    } catch (error) {
      console.error("Invoice export CSV API not available:", error);
      throw error;
    }
  },

  /**
   * Mark invoice as sent
   */
  async markAsSent(id, data = {}) {
    try {
      const response = await axios.post(`/sales/invoices/${id}/mark-sent`, data);
      return response;
    } catch (error) {
      console.error("Invoice mark as sent API not available:", error);
      throw error;
    }
  },

  /**
   * Mark invoice as paid
   */
  async markAsPaid(id, paymentData) {
    try {
      const response = await axios.post(`/sales/invoices/${id}/mark-paid`, paymentData);
      return response;
    } catch (error) {
      console.error("Invoice mark as paid API not available:", error);
      throw error;
    }
  },

  /**
   * Cancel invoice
   */
  async cancel(id, reason) {
    try {
      const response = await axios.post(`/sales/invoices/${id}/cancel`, { reason });
      return response;
    } catch (error) {
      console.error("Invoice cancel API not available:", error);
      throw error;
    }
  },

  /**
   * Generate invoice PDF
   */
  async generatePdf(id) {
    try {
      const response = await axios.get(`/sales/invoices/${id}/pdf`, {
        responseType: "blob",
      });
      return response;
    } catch (error) {
      console.error("Invoice PDF generation API not available:", error);
      throw error;
    }
  },

  /**
   * Download invoice PDF (alias)
   */
  async downloadPdf(id) {
    return this.generatePdf(id);
  },

  /**
   * Send invoice via email
   */
  async sendEmail(id, emailData) {
    try {
      const response = await axios.post(`/sales/invoices/${id}/send-email`, emailData);
      return response;
    } catch (error) {
      console.error("Invoice email send API not available:", error);
      throw error;
    }
  },

  /**
   * Update invoice status (maps to backend actions)
   */
  async updateStatus(id, payload = {}) {
    const status = String(payload.status || "").toUpperCase();
    if (status === "SENT") return this.markAsSent(id);
    if (status === "PAID") return this.markAsPaid(id);
    if (status === "CANCELLED" || status === "CANCELED") return this.cancel(id, payload.reason);
    throw new Error(`Unsupported invoice status: ${status || "unknown"}`);
  },
};

export default invoicesService;
