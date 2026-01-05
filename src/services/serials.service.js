// src/services/serials.service.js
import api from "@/lib/axios";

/**
 * Serials Service
 * Provides API endpoints for serial number management including creation, lookup, and history
 */
const serialsService = {
  /**
   * Get serial details by serial number
   * @param {string} serial - The serial number to lookup
   * @returns {Promise} API response with serial details
   */
  getSerial(serial) {
    return api.get(`/inventory/serials/${encodeURIComponent(serial)}`);
  },

  /**
   * Get serial history/events
   * @param {string} serial - The serial number
   * @param {Object} params - Query parameters (type, q, from, to, page, limit)
   * @returns {Promise} API response with serial history
   */
  getSerialHistory(serial, params = {}) {
    return api.get(`/inventory/serials/${encodeURIComponent(serial)}/history`, { params });
  },

  /**
   * Register/generate new serials for a work order and lot
   * @param {Object} payload - Serial registration data
   * @param {string} payload.plant - Plant identifier
   * @param {string} payload.workOrderNo - Work order number
   * @param {string} payload.lotNo - Lot number
   * @param {string} payload.itemCode - Item code
   * @param {string} payload.revision - Revision
   * @param {number} payload.quantity - Number of serials to generate
   * @param {string} payload.mfgDate - Manufacturing date
   * @returns {Promise} API response with generated serials
   */
  registerSerials(payload) {
    return api.post("/inventory/serials/register", payload);
  },

  /**
   * Get serials list with filtering
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with serials list
   */
  getSerials(params = {}) {
    return api.get("/inventory/serials", { params });
  },

  /**
   * Update serial status or details
   * @param {string} serial - The serial number
   * @param {Object} updates - Fields to update
   * @returns {Promise} API response
   */
  updateSerial(serial, updates) {
    return api.put(`/inventory/serials/${encodeURIComponent(serial)}`, updates);
  },

  /**
   * Delete a serial (if supported by backend)
   * @param {string} serial - The serial number
   * @returns {Promise} API response
   */
  deleteSerial(serial) {
    return api.delete(`/inventory/serials/${encodeURIComponent(serial)}`);
  },

  /**
   * Bulk operations on serials
   * @param {Object} payload - Bulk operation data
   * @returns {Promise} API response
   */
  bulkOperation(payload) {
    return api.post("/inventory/serials/bulk", payload);
  }
};

export default serialsService;