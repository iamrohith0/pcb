import http from "@/lib/axios";

const API_BASE = "/api/sales/customers";

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
    const response = await http.get(API_BASE, { params });
    return response.data;
  },

  /**
   * Get customer by ID
   * @param {string} id - Customer ID
   * @returns {Promise} API response
   */
  async get(id) {
    const response = await http.get(`${API_BASE}/${id}`);
    return response.data;
  },

  /**
   * Create new customer
   * @param {Object} customerData - Customer data
   * @returns {Promise} API response
   */
  async create(customerData) {
    const response = await http.post(API_BASE, customerData);
    return response.data;
  },

  /**
   * Update customer
   * @param {string} id - Customer ID
   * @param {Object} customerData - Updated customer data
   * @returns {Promise} API response
   */
  async update(id, customerData) {
    const response = await http.put(`${API_BASE}/${id}`, customerData);
    return response.data;
  },

  /**
   * Delete customer
   * @param {string} id - Customer ID
   * @returns {Promise} API response
   */
  async remove(id) {
    const response = await http.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  /**
   * Bulk delete customers
   * @param {Array} ids - Array of customer IDs
   * @returns {Promise} API response
   */
  async bulkDelete(ids) {
    const response = await http.delete(`${API_BASE}/bulk`, { data: { ids } });
    return response.data;
  },

  /**
   * Export customers to CSV
   * @param {Object} params - Export parameters
   * @returns {Promise} API response
   */
  async exportCsv(params = {}) {
    const response = await http.get(`${API_BASE}/export/csv`, {
      params,
      responseType: "blob"
    });
    return response;
  },

  /**
   * Get customer statistics
   * @returns {Promise} API response
   */
  async getStats() {
    const response = await http.get(`${API_BASE}/stats`);
    return response.data;
  }
};
