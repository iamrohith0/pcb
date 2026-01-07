/**
 * Inventory Items Service
 * Provides API methods for managing inventory items
 */

import axios from "@/lib/axios";

class InventoryItemsService {
  /**
   * List items with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async list(params = {}) {
    try {
      const response = await axios.get("/api/inventory/items", { params });
      return response;
    } catch (error) {
      console.error("Error fetching items:", error);
      throw error;
    }
  }

  /**
   * Get a single item by ID
   * @param {string} id - Item ID
   * @returns {Promise} API response
   */
  async get(id) {
    try {
      const response = await axios.get(`/api/inventory/items/${id}`);
      return response;
    } catch (error) {
      console.error("Error fetching item:", error);
      throw error;
    }
  }

  /**
   * Create a new item
   * @param {Object} data - Item data
   * @returns {Promise} API response
   */
  async create(data) {
    try {
      const response = await axios.post("/api/inventory/items", data);
      return response;
    } catch (error) {
      console.error("Error creating item:", error);
      throw error;
    }
  }

  /**
   * Update an existing item
   * @param {string} id - Item ID
   * @param {Object} data - Updated item data
   * @returns {Promise} API response
   */
  async update(id, data) {
    try {
      const response = await axios.put(`/api/inventory/items/${id}`, data);
      return response;
    } catch (error) {
      console.error("Error updating item:", error);
      throw error;
    }
  }

  /**
   * Delete an item
   * @param {string} id - Item ID
   * @returns {Promise} API response
   */
  async remove(id) {
    try {
      const response = await axios.delete(`/api/inventory/items/${id}`);
      return response;
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error;
    }
  }

  /**
   * Search items by query
   * @param {string} query - Search query
   * @returns {Promise} API response
   */
  async search(query) {
    try {
      const response = await axios.get("/api/inventory/items/search", {
        params: { q: query }
      });
      return response;
    } catch (error) {
      console.error("Error searching items:", error);
      throw error;
    }
  }
}

export default new InventoryItemsService();