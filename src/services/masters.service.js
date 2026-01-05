// src/services/masters.service.js
import api from "@/lib/axios";

/**
 * Masters Service
 * Provides API endpoints for master data including UOMs, categories, and other reference data
 */
const mastersService = {
  /**
   * Get list of UOMs (Units of Measure)
   * @returns {Promise} API response with UOM list
   */
  getUoms() {
    return api.get("/masters/uoms");
  },

  /**
   * Get item categories
   * @returns {Promise} API response with categories
   */
  getItemCategories() {
    return api.get("/masters/item-categories");
  },

  /**
   * Get warehouses
   * @returns {Promise} API response with warehouses
   */
  getWarehouses() {
    return api.get("/masters/warehouses");
  },

  /**
   * Get locations by warehouse
   * @param {string} warehouseId - Warehouse ID
   * @returns {Promise} API response with locations
   */
  getLocationsByWarehouse(warehouseId) {
    return api.get(`/masters/warehouses/${encodeURIComponent(warehouseId)}/locations`);
  },

  /**
   * Get all locations
   * @returns {Promise} API response with all locations
   */
  getLocations() {
    return api.get("/masters/locations");
  },

  /**
   * Get suppliers
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with suppliers
   */
  getSuppliers(params = {}) {
    return api.get("/masters/suppliers", { params });
  },

  /**
   * Get customers
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with customers
   */
  getCustomers(params = {}) {
    return api.get("/masters/customers", { params });
  },

  /**
   * Get work centers
   * @returns {Promise} API response with work centers
   */
  getWorkCenters() {
    return api.get("/masters/work-centers");
  },

  /**
   * Get production lines
   * @returns {Promise} API response with production lines
   */
  getProductionLines() {
    return api.get("/masters/production-lines");
  },

  /**
   * Get departments
   * @returns {Promise} API response with departments
   */
  getDepartments() {
    return api.get("/masters/departments");
  },

  /**
   * Get cost centers
   * @returns {Promise} API response with cost centers
   */
  getCostCenters() {
    return api.get("/masters/cost-centers");
  },

  /**
   * Get tax codes
   * @returns {Promise} API response with tax codes
   */
  getTaxCodes() {
    return api.get("/masters/tax-codes");
  },

  /**
   * Get currencies
   * @returns {Promise} API response with currencies
   */
  getCurrencies() {
    return api.get("/masters/currencies");
  },

  /**
   * Get document types
   * @returns {Promise} API response with document types
   */
  getDocumentTypes() {
    return api.get("/masters/document-types");
  },

  /**
   * Get status codes
   * @param {string} type - Status type (e.g., 'item', 'stock', 'serial')
   * @returns {Promise} API response with status codes
   */
  getStatusCodes(type) {
    return api.get(`/masters/status-codes/${encodeURIComponent(type)}`);
  },

  /**
   * Get reasons for adjustments/transfers
   * @returns {Promise} API response with reasons
   */
  getReasons() {
    return api.get("/masters/reasons");
  },

  /**
   * Get carriers
   * @returns {Promise} API response with carriers
   */
  getCarriers() {
    return api.get("/masters/carriers");
  },

  /**
   * Get equipment types
   * @returns {Promise} API response with equipment types
   */
  getEquipmentTypes() {
    return api.get("/masters/equipment-types");
  },

  /**
   * Get spare part categories
   * @returns {Promise} API response with spare part categories
   */
  getSparePartCategories() {
    return api.get("/masters/spare-part-categories");
  },

  /**
   * Get maintenance types
   * @returns {Promise} API response with maintenance types
   */
  getMaintenanceTypes() {
    return api.get("/masters/maintenance-types");
  },

  /**
   * Get inspection types
   * @returns {Promise} API response with inspection types
   */
  getInspectionTypes() {
    return api.get("/masters/inspection-types");
  },

  /**
   * Get defect codes
   * @returns {Promise} API response with defect codes
   */
  getDefectCodes() {
    return api.get("/masters/defect-codes");
  },

  /**
   * Get disposition codes
   * @returns {Promise} API response with disposition codes
   */
  getDispositionCodes() {
    return api.get("/masters/disposition-codes");
  },

  /**
   * Get NCR types
   * @returns {Promise} API response with NCR types
   */
  getNcrTypes() {
    return api.get("/masters/ncr-types");
  },

  /**
   * Get CAPA types
   * @returns {Promise} API response with CAPA types
   */
  getCapaTypes() {
    return api.get("/masters/capa-types");
  },

  /**
   * Get document series
   * @returns {Promise} API response with document series
   */
  getDocumentSeries() {
    return api.get("/masters/document-series");
  },

  /**
   * Get number series
   * @param {string} type - Series type (e.g., 'serial', 'lot', 'work-order')
   * @returns {Promise} API response with number series
   */
  getNumberSeries(type) {
    return api.get(`/masters/number-series/${encodeURIComponent(type)}`);
  },

  /**
   * Get system parameters
   * @returns {Promise} API response with system parameters
   */
  getSystemParameters() {
    return api.get("/masters/system-parameters");
  },

  /**
   * Get user roles
   * @returns {Promise} API response with user roles
   */
  getUserRoles() {
    return api.get("/masters/user-roles");
  },

  /**
   * Get permissions
   * @returns {Promise} API response with permissions
   */
  getPermissions() {
    return api.get("/masters/permissions");
  },

  /**
   * Create a new master record
   * @param {string} type - Master type (e.g., 'uom', 'category', 'warehouse')
   * @param {Object} data - Master data
   * @returns {Promise} API response with created record
   */
  createMaster(type, data) {
    return api.post(`/masters/${encodeURIComponent(type)}`, data);
  },

  /**
   * Update a master record
   * @param {string} type - Master type
   * @param {string} id - Record ID
   * @param {Object} data - Updated data
   * @returns {Promise} API response with updated record
   */
  updateMaster(type, id, data) {
    return api.put(`/masters/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, data);
  },

  /**
   * Delete a master record
   * @param {string} type - Master type
   * @param {string} id - Record ID
   * @returns {Promise} API response
   */
  deleteMaster(type, id) {
    return api.delete(`/masters/${encodeURIComponent(type)}/${encodeURIComponent(id)}`);
  },

  /**
   * Get master data by type with filtering
   * @param {string} type - Master type
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with master data
   */
  getMasterData(type, params = {}) {
    return api.get(`/masters/${encodeURIComponent(type)}`, { params });
  }
};

export default mastersService;