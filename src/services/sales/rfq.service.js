import axios from "@/lib/axios";
import mockDataService from "@/services/mockData.service";

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
      console.warn("RFQ API not available, using mock data:", error);
      // Fallback to mock data
      try {
        const mockResponse = await mockDataService.getRFQs(params);
        return {
          data: mockResponse.data,
          status: 200,
          statusText: "OK",
          headers: {},
          config: {}
        };
      } catch (mockError) {
        console.error("Mock data also failed:", mockError);
        throw error;
      }
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
      console.warn("RFQ create API not available, using mock:", error);
      try {
        const mockResponse = await mockDataService.createRFQ(data);
        return {
          data: mockResponse.data,
          status: 201,
          statusText: "Created",
          headers: {},
          config: {}
        };
      } catch (mockError) {
        console.error("Mock create failed:", mockError);
        throw error;
      }
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
      console.warn("RFQ get API not available, using mock:", error);
      try {
        const mockResponse = await mockDataService.getRFQ(id);
        return {
          data: mockResponse.data,
          status: 200,
          statusText: "OK",
          headers: {},
          config: {}
        };
      } catch (mockError) {
        console.error("Mock get failed:", mockError);
        throw error;
      }
    }
  },

  /**
   * Update RFQ
   */
  async update(id, data) {
    try {
      const response = await axios.put(`/sales/rfqs/${id}`, data);
      return response;
    } catch (error) {
      console.warn("RFQ update API not available, using mock:", error);
      try {
        const mockResponse = await mockDataService.updateRFQ(id, data);
        return {
          data: mockResponse.data,
          status: 200,
          statusText: "OK",
          headers: {},
          config: {}
        };
      } catch (mockError) {
        console.error("Mock update failed:", mockError);
        throw error;
      }
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
      console.warn("RFQ delete API not available, using mock:", error);
      try {
        const mockResponse = await mockDataService.deleteRFQ(id);
        return {
          data: mockResponse.data,
          status: 200,
          statusText: "OK",
          headers: {},
          config: {}
        };
      } catch (mockError) {
        console.error("Mock delete failed:", mockError);
        throw error;
      }
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
      console.warn("RFQ export CSV API not available, using mock:", error);
      // Create a mock CSV blob
      const csvContent = "RFQ No,Customer,Date,Status,Total Qty\nRFQ-2026-001,Tech Solutions Ltd,2026-01-05,Open,1000\nRFQ-2026-002,Electronics India Pvt Ltd,2026-01-04,Quoted,2000";
      const blob = new Blob([csvContent], { type: "text/csv" });
      return {
        data: blob,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {}
      };
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
      console.warn("RFQ convert to quotation API not available:", error);
      throw error;
    }
  },
};

export default rfqService;