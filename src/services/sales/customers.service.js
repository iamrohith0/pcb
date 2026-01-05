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
      console.warn("Customer API not available, using mock data:", error);
      // Fallback to mock data
      try {
        const mockResponse = await mockDataService.getCustomers(params);
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
   * Get customer by ID
   * @param {string} id - Customer ID
   * @returns {Promise} API response
   */
  async get(id) {
    try {
      const response = await http.get(`${API_BASE}/${id}`);
      return response;
    } catch (error) {
      console.warn("Customer get API not available, using mock:", error);
      try {
        const mockResponse = await mockDataService.getCustomer(id);
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
   * Create new customer
   * @param {Object} customerData - Customer data
   * @returns {Promise} API response
   */
  async create(customerData) {
    try {
      const response = await http.post(API_BASE, customerData);
      return response;
    } catch (error) {
      console.warn("Customer create API not available, using mock:", error);
      // For create, we'll need to implement mock create in mockDataService
      // For now, just throw the error
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
      console.warn("Customer update API not available, using mock:", error);
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
      console.warn("Customer delete API not available, using mock:", error);
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
      console.warn("Customer bulk delete API not available:", error);
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
      console.warn("Customer export CSV API not available:", error);
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
      console.warn("Customer stats API not available:", error);
      throw error;
    }
  }
};