// src/services/sales/quotations.service.js
import http from "@/lib/axios";

const API_BASE = "/sales/quotations";

/**
 * Service for handling quotations API operations
 */
const quotationsService = {
  /**
   * Get quotation by ID
   * @param {string} id - Quotation ID
   * @returns {Promise<Object>} API response with quotation data
   */
  async getById(id) {
    try {
      const response = await http.get(`${API_BASE}/${id}`);
      return response;
    } catch (error) {
      console.error("Error fetching quotation:", error);
      throw error;
    }
  },

  /**
   * Update quotation
   * @param {string} id - Quotation ID
   * @param {Object} payload - Updated quotation data
   * @returns {Promise<Object>} API response
   */
  async update(id, payload) {
    try {
      const response = await http.put(`${API_BASE}/${id}`, payload);
      return response;
    } catch (error) {
      console.error("Error updating quotation:", error);
      throw error;
    }
  },

  /**
   * Update quotation internal note
   * @param {string} id - Quotation ID
   * @param {Object} payload - Note data
   * @returns {Promise<Object>} API response
   */
  async updateNote(id, payload) {
    try {
      const response = await http.patch(`${API_BASE}/${id}/note`, payload);
      return response;
    } catch (error) {
      console.error("Error updating quotation note:", error);
      throw error;
    }
  },

  /**
   * Send quotation to customer
   * @param {string} id - Quotation ID
   * @returns {Promise<Object>} API response
   */
  async sendToCustomer(id) {
    try {
      const response = await http.post(`${API_BASE}/${id}/send`);
      return response;
    } catch (error) {
      console.error("Error sending quotation to customer:", error);
      throw error;
    }
  },

  /**
   * Convert quotation to sales order
   * @param {string} id - Quotation ID
   * @returns {Promise<Object>} API response with created sales order
   */
  async convertToSalesOrder(id) {
    try {
      const response = await http.post(`${API_BASE}/${id}/convert`);
      return response;
    } catch (error) {
      console.error("Error converting quotation to sales order:", error);
      throw error;
    }
  },

  /**
   * Download quotation as PDF
   * @param {string} id - Quotation ID
   * @returns {Promise<Object>} API response with PDF file
   */
  async downloadPdf(id) {
    try {
      const response = await http.get(`${API_BASE}/${id}/pdf`, {
        responseType: "blob"
      });
      // Create download link
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `quotation-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return response;
    } catch (error) {
      console.error("Error downloading quotation PDF:", error);
      throw error;
    }
  },

  /**
   * List quotations with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (1-based)
   * @param {number} params.limit - Items per page
   * @param {string} params.q - Search query
   * @param {string} params.status - Filter by status
   * @param {string} params.sort - Sort order
   * @returns {Promise<Object>} API response with data and pagination
   */
  async list({ page = 1, limit = 10, q = "", status = "all", sort = "date_desc" }) {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(q && { q }),
        ...(status !== "all" && { status }),
        ...(sort && { sort }),
      });

      const response = await http.get(`${API_BASE}?${params.toString()}`);
      return response;
    } catch (error) {
      console.error("Error fetching quotations:", error);
      throw error;
    }
  },

  /**
   * Create a new quotation
   * @param {Object} payload - Quotation data
   * @returns {Promise<Object>} API response with created quotation
   */
  async create(payload) {
    try {
      const response = await http.post(API_BASE, payload);
      return response;
    } catch (error) {
      console.error("Error creating quotation:", error);
      throw error;
    }
  },

  /**
   * Delete a quotation by ID
   * @param {string} id - Quotation ID
   * @returns {Promise<Object>} API response
   */
  async remove(id) {
    try {
      const response = await http.delete(`${API_BASE}/${id}`);
      return response;
    } catch (error) {
      console.error("Error deleting quotation:", error);
      throw error;
    }
  },
};

export default quotationsService;
