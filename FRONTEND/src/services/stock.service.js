// src/services/stock.service.js
import api from "@/lib/axios";

/**
 * Stock Service
 * Provides API endpoints for stock management including dashboard, ledger, transfers, and valuation
 */
const stockService = {
  /**
   * Get stock dashboard summary
   * @returns {Promise} API response with stock summary
   */
  getSummary() {
    return api.get("inventory/stock/summary");
  },

  /**
   * Get stock alerts (low stock, out of stock, expiring)
   * @param {Object} params - Query parameters (type, limit)
   * @returns {Promise} API response with alerts
   */
  getAlerts(params = {}) {
    return api.get("inventory/stock/alerts", { params });
  },

  /**
   * Get stock movements
   * @param {Object} params - Query parameters (limit, type, from, to)
   * @returns {Promise} API response with movements
   */
  getMovements(params = {}) {
    return api.get("inventory/stock/movements", { params });
  },

  /**
   * Get stock ledger for an item/warehouse
   * @param {Object} params - Query parameters (item, warehouse, lot, from, to, type, ref, q)
   * @returns {Promise} API response with ledger data
   */
  getLedger(params = {}) {
    return api.get("inventory/stock/ledger", { params });
  },

  /**
   * Get stock valuation
   * @param {Object} params - Query parameters (asOfDate, warehouse, location, method)
   * @returns {Promise} API response with valuation data
   */
  getValuation(params = {}) {
    return api.get("inventory/stock/valuation", { params });
  },

  /**
   * Create stock transfer
   * @param {Object} payload - Transfer data
   * @returns {Promise} API response with created transfer
   */
  createTransfer(payload) {
    return api.post("inventory/stock/transfers", payload);
  },

  /**
   * Get transfer defaults (for form prefilling)
   * @returns {Promise} API response with default values
   */
  getTransferDefaults() {
    return api.get("inventory/stock/transfer/defaults");
  },

  /**
   * Lookup item for transfer
   * @param {Object} params - Query parameters (q)
   * @returns {Promise} API response with item details
   */
  lookupItem(params = {}) {
    return api.get("inventory/items/lookup", { params });
  },

  /**
   * Get item availability
   * @param {Object} params - Query parameters (itemCode, warehouse, location, lotNo, serialNo)
   * @returns {Promise} API response with availability
   */
  getAvailability(params = {}) {
    return api.get("inventory/stock/availability", { params });
  },

  /**
   * Get stock list with filtering
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with stock list
   */
  getStockList(params = {}) {
    return api.get("inventory/stock", { params });
  },

  /**
   * Get stock by item code
   * @param {string} itemCode - Item code
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with stock details
   */
  getStockByItem(itemCode, params = {}) {
    return api.get(`inventory/stock/item/${encodeURIComponent(itemCode)}`, { params });
  },

  /**
   * Get stock by warehouse
   * @param {string} warehouse - Warehouse code
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with warehouse stock
   */
  getStockByWarehouse(warehouse, params = {}) {
    return api.get(`inventory/stock/warehouse/${encodeURIComponent(warehouse)}`, { params });
  },

  /**
   * Get stock adjustments history
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with adjustments
   */
  getAdjustments(params = {}) {
    return api.get("inventory/stock/adjustments", { params });
  },

  /**
   * Create stock adjustment
   * @param {Object} payload - Adjustment data
   * @returns {Promise} API response with created adjustment
   */
  createAdjustment(payload) {
    return api.post("inventory/stock/adjustments", payload);
  },

  /**
   * Get stock transfers list
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with transfers
   */
  getTransfers(params = {}) {
    return api.get("inventory/stock/transfers", { params });
  },

  /**
   * Get transfer details
   * @param {string} transferId - Transfer ID
   * @returns {Promise} API response with transfer details
   */
  getTransfer(transferId) {
    return api.get(`inventory/stock/transfers/${encodeURIComponent(transferId)}`);
  },

  /**
   * Update transfer status
   * @param {string} transferId - Transfer ID
   * @param {Object} updates - Status updates
   * @returns {Promise} API response
   */
  updateTransfer(transferId, updates) {
    return api.put(`inventory/stock/transfers/${encodeURIComponent(transferId)}`, updates);
  },

  /**
   * Cancel transfer
   * @param {string} transferId - Transfer ID
   * @returns {Promise} API response
   */
  cancelTransfer(transferId) {
    return api.post(`inventory/stock/transfers/${encodeURIComponent(transferId)}/cancel`);
  },

  /**
   * Print transfer document
   * @param {string} transferId - Transfer ID
   * @returns {Promise} API response with PDF
   */
  printTransferPdf(transferId) {
    return api.get(`inventory/stock/transfers/${encodeURIComponent(transferId)}/print`, {
      responseType: "blob"
    });
  },

  /**
   * Get stock reports
   * @param {Object} params - Report parameters
   * @returns {Promise} API response with report data
   */
  getReports(params = {}) {
    return api.get("inventory/stock/reports", { params });
  },

  /**
   * Export stock data
   * @param {Object} params - Export parameters
   * @returns {Promise} API response with exported file
   */
  exportStock(params = {}) {
    return api.get("inventory/stock/export", {
      params,
      responseType: "blob"
    });
  }
};

export default stockService;