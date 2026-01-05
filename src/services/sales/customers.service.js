import http from "@/lib/axios";
import mockDataService from "@/services/mockData.service";

const API_BASE = "/api/v1/sales/customers";

export default {
  /**
   * List customers with optional filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (1-based)
   * @param {number} params.size - Page size
   * @param {string} params.q - Search query
   * @param {string} params.status - Filter by status
   * @returns {Promise} API response
   */
  async list(params = {}) {
    try {
      const response = await http.get(API_BASE, { params });
      return response;
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  },

  /**
   * Get customer by ID
   * @param {string} id - Customer ID
   * @returns {Promise} API response
   */
  async get(id) {
    try {
      const response = await http.get(`${API_BASE}/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching customer ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new customer
   * @param {Object} customerData - Customer data
   * @returns {Promise} API response
   */
  async create(customerData) {
    try {
      const response = await http.post(API_BASE, customerData);
      return response;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  },

  /**
   * Update customer
   * @param {string} id - Customer ID
   * @param {Object} customerData - Updated customer data
   * @returns {Promise} API response
   */
  async update(id, customerData) {
    try {
      const response = await http.put(`${API_BASE}/${id}`, customerData);
      return response;
    } catch (error) {
      console.error(`Error updating customer ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete customer
   * @param {string} id - Customer ID
   * @returns {Promise} API response
   */
  async remove(id) {
    try {
      const response = await http.delete(`${API_BASE}/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting customer ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bulk delete customers
   * @param {Array} ids - Array of customer IDs
   * @returns {Promise} API response
   */
  async bulkDelete(ids) {
    try {
      const response = await http.delete(`${API_BASE}/bulk`, { data: { ids } });
      return response;
    } catch (error) {
      console.error("Error bulk deleting customers:", error);
      throw error;
    }
  },

  /**
   * Export customers to CSV
   * @param {Object} params - Export parameters
   * @returns {Promise} API response
   */
  async exportCsv(params = {}) {
    try {
      const response = await http.get(`${API_BASE}/export/csv`, {
        params,
        responseType: "blob"
      });
      return response;
    } catch (error) {
      console.error("Error exporting customers:", error);
      throw error;
    }
  },

  /**
   * Get customer statistics
   * @returns {Promise} API response
   */
  async getStats() {
    try {
      const response = await http.get(`${API_BASE}/stats`);
      return response;
    } catch (error) {
      console.error("Error fetching customer stats:", error);
      throw error;
    }
  }
};