/**
 * Inventory Stock Service
 * Provides API methods for managing stock operations and dashboard data
 */

import axios from "@/lib/axios";

class StockService {
  /**
   * Get stock summary dashboard data
   * @returns {Promise} API response
   */
  async getSummary() {
    try {
      const response = await axios.get("/api/inventory/stock/summary");
      return response;
    } catch (error) {
      console.error("Error fetching stock summary:", error);
      throw error;
    }
  }

  /**
   * Get stock alerts (low stock, out of stock, expiring)
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getAlerts(params = {}) {
    try {
      const response = await axios.get("/api/inventory/stock/alerts", { params });
      return response;
    } catch (error) {
      console.error("Error fetching stock alerts:", error);
      throw error;
    }
  }

  /**
   * Get recent stock movements
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getMovements(params = {}) {
    try {
      const response = await axios.get("/api/inventory/stock/movements", { params });
      return response;
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      throw error;
    }
  }

  /**
   * Get stock by item
   * @param {string} itemId - Item ID
   * @returns {Promise} API response
   */
  async getByItem(itemId) {
    try {
      const response = await axios.get(`/api/inventory/stock/items/${itemId}`);
      return response;
    } catch (error) {
      console.error("Error fetching stock by item:", error);
      throw error;
    }
  }

  /**
   * Get stock by warehouse
   * @param {string} warehouseId - Warehouse ID
   * @returns {Promise} API response
   */
  async getByWarehouse(warehouseId) {
    try {
      const response = await axios.get(`/api/inventory/stock/warehouses/${warehouseId}`);
      return response;
    } catch (error) {
      console.error("Error fetching stock by warehouse:", error);
      throw error;
    }
  }

  /**
   * Get stock adjustments
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getAdjustments(params = {}) {
    try {
      const response = await axios.get("/api/inventory/stock/adjustments", { params });
      return response;
    } catch (error) {
      console.error("Error fetching stock adjustments:", error);
      throw error;
    }
  }

  /**
   * Create stock adjustment
   * @param {Object} data - Adjustment data
   * @returns {Promise} API response
   */
  async createAdjustment(data) {
    try {
      const response = await axios.post("/api/inventory/stock/adjustments", data);
      return response;
    } catch (error) {
      console.error("Error creating stock adjustment:", error);
      throw error;
    }
  }

  /**
   * Get stock lots
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getLots(params = {}) {
    try {
      const response = await axios.get("/api/inventory/stock/lots", { params });
      return response;
    } catch (error) {
      console.error("Error fetching stock lots:", error);
      throw error;
    }
  }

  /**
   * Get stock serials
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getSerials(params = {}) {
    try {
      const response = await axios.get("/api/inventory/stock/serials", { params });
      return response;
    } catch (error) {
      console.error("Error fetching stock serials:", error);
      throw error;
    }
  }
}

export default new StockService();