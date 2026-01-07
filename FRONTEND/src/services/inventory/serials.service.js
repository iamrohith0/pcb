/**
 * Inventory Serials Service
 * Provides API methods for managing serial number tracking and traceability
 */

import axios from "@/lib/axios";

class SerialsService {
  /**
   * Register serials for a work order and lot
   * @param {Object} data - Registration data
   * @returns {Promise} API response
   */
  async registerSerials(data) {
    try {
      const response = await axios.post("/api/inventory/serials/register", data);
      return response;
    } catch (error) {
      console.error("Error registering serials:", error);
      throw error;
    }
  }

  /**
   * Get serial by ID
   * @param {string} id - Serial ID
   * @returns {Promise} API response
   */
  async getById(id) {
    try {
      const response = await axios.get(`/api/inventory/serials/${id}`);
      return response;
    } catch (error) {
      console.error("Error fetching serial:", error);
      throw error;
    }
  }

  /**
   * Search serials
   * @param {Object} params - Search parameters
   * @returns {Promise} API response
   */
  async search(params = {}) {
    try {
      const response = await axios.get("/api/inventory/serials/search", { params });
      return response;
    } catch (error) {
      console.error("Error searching serials:", error);
      throw error;
    }
  }

  /**
   * Get serial history/transactions
   * @param {string} id - Serial ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getHistory(id, params = {}) {
    try {
      const response = await axios.get(`/api/inventory/serials/${id}/history`, { params });
      return response;
    } catch (error) {
      console.error("Error fetching serial history:", error);
      throw error;
    }
  }

  /**
   * Get serial genealogy (parent/child relationships)
   * @param {string} id - Serial ID
   * @returns {Promise} API response
   */
  async getGenealogy(id) {
    try {
      const response = await axios.get(`/api/inventory/serials/${id}/genealogy`);
      return response;
    } catch (error) {
      console.error("Error fetching serial genealogy:", error);
      throw error;
    }
  }

  /**
   * Update serial status
   * @param {string} id - Serial ID
   * @param {string} status - New status
   * @returns {Promise} API response
   */
  async updateStatus(id, status) {
    try {
      const response = await axios.patch(`/api/inventory/serials/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error("Error updating serial status:", error);
      throw error;
    }
  }

  /**
   * Link serial to lot
   * @param {string} serialId - Serial ID
   * @param {string} lotId - Lot ID
   * @returns {Promise} API response
   */
  async linkToLot(serialId, lotId) {
    try {
      const response = await axios.post(`/api/inventory/serials/${serialId}/link/lot`, { lotId });
      return response;
    } catch (error) {
      console.error("Error linking serial to lot:", error);
      throw error;
    }
  }

  /**
   * Link serial to work order
   * @param {string} serialId - Serial ID
   * @param {string} workOrderId - Work Order ID
   * @returns {Promise} API response
   */
  async linkToWorkOrder(serialId, workOrderId) {
    try {
      const response = await axios.post(`/api/inventory/serials/${serialId}/link/workorder`, { workOrderId });
      return response;
    } catch (error) {
      console.error("Error linking serial to work order:", error);
      throw error;
    }
  }

  /**
   * Get serials by work order
   * @param {string} workOrderId - Work Order ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getByWorkOrder(workOrderId, params = {}) {
    try {
      const response = await axios.get(`/api/inventory/serials/workorder/${workOrderId}`, { params });
      return response;
    } catch (error) {
      console.error("Error fetching serials by work order:", error);
      throw error;
    }
  }

  /**
   * Get serials by lot
   * @param {string} lotId - Lot ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getByLot(lotId, params = {}) {
    try {
      const response = await axios.get(`/api/inventory/serials/lot/${lotId}`, { params });
      return response;
    } catch (error) {
      console.error("Error fetching serials by lot:", error);
      throw error;
    }
  }

  /**
   * Validate serial format
   * @param {string} serial - Serial number
   * @returns {Promise} API response
   */
  async validateSerial(serial) {
    try {
      const response = await axios.post("/api/inventory/serials/validate", { serial });
      return response;
    } catch (error) {
      console.error("Error validating serial:", error);
      throw error;
    }
  }
}

export default new SerialsService();