// src/services/sales/salesOrders.service.js
import http from "@/lib/axios";

const API_BASE = "/api/v1/sales/orders";

/**
 * Service for handling sales orders API operations
 */
const salesOrdersService = {
  /**
   * List sales orders with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (1-based)
   * @param {number} params.limit - Items per page
   * @param {string} params.q - Search query
   * @param {string} params.status - Filter by status
   * @param {string} params.date_from - Filter by date from
   * @param {string} params.date_to - Filter by date to
   * @param {string} params.sort_by - Sort field
   * @param {string} params.sort_dir - Sort direction (asc|desc)
   * @returns {Promise<Object>} API response with data and pagination
   */
  async list(params = {}) {
    try {
      const response = await http.get(API_BASE, { params });
      return response;
    } catch (error) {
      console.error("Error fetching sales orders:", error);
      throw error;
    }
  },

  /**
   * Get sales order by ID
   * @param {string} id - Sales order ID
   * @returns {Promise<Object>} API response with sales order data
   */
  async getById(id) {
    try {
      const response = await http.get(`${API_BASE}/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching sales order ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new sales order
   * @param {Object} payload - Sales order data
   * @returns {Promise<Object>} API response with created sales order
   */
  async create(payload) {
    try {
      const response = await http.post(API_BASE, payload);
      return response;
    } catch (error) {
      console.error("Error creating sales order:", error);
      throw error;
    }
  },

  /**
   * Update sales order
   * @param {string} id - Sales order ID
   * @param {Object} payload - Updated sales order data
   * @returns {Promise<Object>} API response
   */
  async update(id, payload) {
    try {
      const response = await http.put(`${API_BASE}/${id}`, payload);
      return response;
    } catch (error) {
      console.error(`Error updating sales order ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a sales order by ID
   * @param {string} id - Sales order ID
   * @returns {Promise<Object>} API response
   */
  async remove(id) {
    try {
      const response = await http.delete(`${API_BASE}/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting sales order ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update sales order status
   * @param {string} id - Sales order ID
   * @param {string} status - New status
   * @returns {Promise<Object>} API response
   */
  async updateStatus(id, status) {
    try {
      const response = await http.patch(`${API_BASE}/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error(`Error updating sales order ${id} status:`, error);
      throw error;
    }
  },

  /**
   * Get sales order items
   * @param {string} id - Sales order ID
   * @returns {Promise<Object>} API response with order items
   */
  async getItems(id) {
    try {
      const response = await http.get(`${API_BASE}/${id}/items`);
      return response;
    } catch (error) {
      console.error(`Error fetching sales order ${id} items:`, error);
      throw error;
    }
  },

  /**
   * Add item to sales order
   * @param {string} id - Sales order ID
   * @param {Object} itemData - Item data
   * @returns {Promise<Object>} API response
   */
  async addItem(id, itemData) {
    try {
      const response = await http.post(`${API_BASE}/${id}/items`, itemData);
      return response;
    } catch (error) {
      console.error(`Error adding item to sales order ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update sales order item
   * @param {string} orderId - Sales order ID
   * @param {string} itemId - Item ID
   * @param {Object} itemData - Updated item data
   * @returns {Promise<Object>} API response
   */
  async updateItem(orderId, itemId, itemData) {
    try {
      const response = await http.put(`${API_BASE}/${orderId}/items/${itemId}`, itemData);
      return response;
    } catch (error) {
      console.error(`Error updating item ${itemId} in sales order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Remove item from sales order
   * @param {string} orderId - Sales order ID
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} API response
   */
  async removeItem(orderId, itemId) {
    try {
      const response = await http.delete(`${API_BASE}/${orderId}/items/${itemId}`);
      return response;
    } catch (error) {
      console.error(`Error removing item ${itemId} from sales order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Get sales order history
   * @param {string} id - Sales order ID
   * @returns {Promise<Object>} API response with order history
   */
  async getHistory(id) {
    try {
      const response = await http.get(`${API_BASE}/${id}/history`);
      return response;
    } catch (error) {
      console.error(`Error fetching sales order ${id} history:`, error);
      throw error;
    }
  },

  /**
   * Export sales orders to CSV
   * @param {Object} params - Export parameters
   * @returns {Promise<Object>} API response
   */
  async exportCsv(params = {}) {
    try {
      const response = await http.get(`${API_BASE}/export/csv`, {
        params,
        responseType: "blob"
      });
      return response;
    } catch (error) {
      console.error("Error exporting sales orders:", error);
      throw error;
    }
  },

  /**
   * Get sales order statistics
   * @returns {Promise<Object>} API response
   */
  async getStats() {
    try {
      const response = await http.get(`${API_BASE}/stats`);
      return response;
    } catch (error) {
      console.error("Error fetching sales order stats:", error);
      throw error;
    }
  },
};

export default salesOrdersService;