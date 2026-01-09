import axios from "@/lib/axios";

/**
 * RFQ Service
 * Handles API calls for Request for Quotation functionality
 */
const rfqService = {
  /**
   * Get list of RFQs with optional filters
   */
  async list(params = {}) {
    try {
      const response = await axios.get("/sales/rfqs", { params });
      return response;
    } catch (error) {
      console.error("RFQ API not available:", error);
      throw error;
    }
  },

  /**
   * Get next available RFQ number
   */
  async getNextNumber() {
    try {
      const response = await axios.get("/sales/rfqs/next-number");
      return response;
    } catch (error) {
      console.warn("RFQ next number API not available, using mock:", error);
      return {
        data: {
          next: `RFQ-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`
        }
      };
    }
  },

  /**
   * Create a new RFQ
   */
  async create(data) {
    try {
      const response = await axios.post("/sales/rfqs", data);
      return response;
    } catch (error) {
      console.error("RFQ create API not available:", error);
      throw error;
    }
  },

  /**
   * Create a new RFQ with file attachments (multipart)
   */
  async createMultipart(formData) {
    try {
      const response = await axios.post("/sales/rfqs", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response;
    } catch (error) {
      console.warn("RFQ create multipart API not available, using mock:", error);
      // For multipart, we'll extract the data and use regular create
      const data = JSON.parse(formData.get('data'));
      return this.create(data);
    }
  },

  /**
   * Get RFQ by ID
   */
  async get(id) {
    try {
      const response = await axios.get(`/sales/rfqs/${id}`);
      return response;
    } catch (error) {
      console.error("RFQ get API not available:", error);
      throw error;
    }
  },

  /**
   * Get RFQ by ID (alias)
   */
  async getById(id) {
    return this.get(id);
  },

  /**
   * Update RFQ
   */
  async update(id, data) {
    try {
      const response = await axios.put(`/sales/rfqs/${id}`, data);
      return response;
    } catch (error) {
      console.error("RFQ update API not available:", error);
      throw error;
    }
  },

  /**
   * Delete RFQ
   */
  async remove(id) {
    try {
      const response = await axios.delete(`/sales/rfqs/${id}`);
      return response;
    } catch (error) {
      console.error("RFQ delete API not available:", error);
      throw error;
    }
  },

  /**
   * Export RFQs to CSV
   */
  async exportCsv(params = {}) {
    try {
      const response = await axios.get("/sales/rfqs/export/csv", {
        params,
        responseType: "blob",
      });
      return response;
    } catch (error) {
      console.error("RFQ export CSV API not available:", error);
      throw error;
    }
  },

  /**
   * Convert RFQ to Quotation
   */
  async convertToQuotation(rfqId, quotationData) {
    try {
      const response = await axios.post(`/sales/rfqs/${rfqId}/convert-to-quotation`, quotationData);
      return response;
    } catch (error) {
      console.error("RFQ convert to quotation API not available:", error);
      throw error;
    }
  },
};

export default rfqService;
