/**
 * Inventory Lots Service
 * Provides API methods for managing lot tracking and traceability
 */

import axios from "@/lib/axios";

class LotsService {
  /**
   * List lots with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async list(params = {}) {
    try {
      const response = await axios.get("/api/inventory/lots", { params });
      return response;
    } catch (error) {
      console.error("Error fetching lots:", error);
      throw error;
    }
  }

  /**
   * Get a single lot by ID
   * @param {string} id - Lot ID
   * @returns {Promise} API response
   */
  async getById(id) {
    try {
      const response = await axios.get(`/api/inventory/lots/${id}`);
      return response;
    } catch (error) {
      console.error("Error fetching lot:", error);
      throw error;
    }
  }

  /**
   * Create a new lot
   * @param {Object} data - Lot data
   * @returns {Promise} API response
   */
  async create(data) {
    try {
      const response = await axios.post("/api/inventory/lots", data);
      return response;
    } catch (error) {
      console.error("Error creating lot:", error);
      throw error;
    }
  }

  /**
   * Update an existing lot
   * @param {string} id - Lot ID
   * @param {Object} data - Updated lot data
   * @returns {Promise} API response
   */
  async update(id, data) {
    try {
      const response = await axios.put(`/api/inventory/lots/${id}`, data);
      return response;
    } catch (error) {
      console.error("Error updating lot:", error);
      throw error;
    }
  }

  /**
   * Delete a lot
   * @param {string} id - Lot ID
   * @returns {Promise} API response
   */
  async remove(id) {
    try {
      const response = await axios.delete(`/api/inventory/lots/${id}`);
      return response;
    } catch (error) {
      console.error("Error deleting lot:", error);
      throw error;
    }
  }

  /**
   * Update lot status (Quarantine, Released, Blocked)
   * @param {string} id - Lot ID
   * @param {string} status - New status
   * @returns {Promise} API response
   */
  async updateStatus(id, status) {
    try {
      const response = await axios.patch(`/api/inventory/lots/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error("Error updating lot status:", error);
      throw error;
    }
  }

  /**
   * Get lot movements/transactions
   * @param {string} id - Lot ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getMovements(id, params = {}) {
    try {
      const response = await axios.get(`/api/inventory/lots/${id}/movements`, { params });
      return response;
    } catch (error) {
      console.error("Error fetching lot movements:", error);
      throw error;
    }
  }

  /**
   * Get lot genealogy (parent/child relationships)
   * @param {string} id - Lot ID
   * @returns {Promise} API response
   */
  async getGenealogy(id) {
    try {
      const response = await axios.get(`/api/inventory/lots/${id}/genealogy`);
      return response;
    } catch (error) {
      console.error("Error fetching lot genealogy:", error);
      throw error;
    }
  }

  /**
   * Search lots by query
   * @param {string} query - Search query
   * @returns {Promise} API response
   */
  async search(query) {
    try {
      const response = await axios.get("/api/inventory/lots/search", {
        params: { q: query }
      });
      return response;
    } catch (error) {
      console.error("Error searching lots:", error);
      throw error;
    }
  }
}

export default new LotsService();