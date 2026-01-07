// src/services/settings.service.js
import axios from "@/lib/axios";

/**
 * Settings API service
 * Handles company settings, branding, working hours, and other configuration data
 */
const settingsApi = {
  /**
   * Get company settings
   * @returns {Promise<Object>} Company settings response
   */
  async get() {
    try {
      const response = await axios.get("/api/settings/company");
      return response;
    } catch (error) {
      console.error("Error fetching company settings:", error);
      throw error;
    }
  },

  /**
   * Update company profile
   * @param {Object} data - Company profile data
   * @returns {Promise<Object>} Update response
   */
  async updateCompany(data) {
    try {
      const response = await axios.put("/api/settings/company", data);
      return response;
    } catch (error) {
      console.error("Error updating company profile:", error);
      throw error;
    }
  },

  /**
   * Get working hours configuration
   * @returns {Promise<Object>} Working hours response
   */
  async getWorkingHours() {
    try {
      const response = await axios.get("/api/settings/working-hours");
      return response;
    } catch (error) {
      console.error("Error fetching working hours:", error);
      throw error;
    }
  },

  /**
   * Update working hours configuration
   * @param {Object} data - Working hours data
   * @returns {Promise<Object>} Update response
   */
  async updateWorkingHours(data) {
    try {
      const response = await axios.put("/api/settings/working-hours", data);
      return response;
    } catch (error) {
      console.error("Error updating working hours:", error);
      throw error;
    }
  },

  /**
   * Get branding configuration
   * @returns {Promise<Object>} Branding response
   */
  async getBranding() {
    try {
      const response = await axios.get("/api/settings/branding");
      return response;
    } catch (error) {
      console.error("Error fetching branding settings:", error);
      throw error;
    }
  },

  /**
   * Update branding configuration
   * @param {Object} data - Branding data
   * @returns {Promise<Object>} Update response
   */
  async updateBranding(data) {
    try {
      const response = await axios.put("/api/settings/branding", data);
      return response;
    } catch (error) {
      console.error("Error updating branding settings:", error);
      throw error;
    }
  },

  /**
   * Get integration settings
   * @returns {Promise<Object>} Integration settings response
   */
  async getIntegrations() {
    try {
      const response = await axios.get("/api/settings/integrations");
      return response;
    } catch (error) {
      console.error("Error fetching integration settings:", error);
      throw error;
    }
  },

  /**
   * Update integration settings
   * @param {Object} data - Integration data
   * @returns {Promise<Object>} Update response
   */
  async updateIntegration(data) {
    try {
      const response = await axios.put("/api/settings/integrations", data);
      return response;
    } catch (error) {
      console.error("Error updating integration settings:", error);
      throw error;
    }
  },

  /**
   * Get numbering series configuration
   * @returns {Promise<Object>} Numbering series response
   */
  async getNumberingSeries() {
    try {
      const response = await axios.get("/api/settings/numbering");
      return response;
    } catch (error) {
      console.error("Error fetching numbering series:", error);
      throw error;
    }
  },

  /**
   * Update numbering series configuration
   * @param {Object} data - Numbering series data
   * @returns {Promise<Object>} Update response
   */
  async updateNumberingSeries(data) {
    try {
      const response = await axios.put("/api/settings/numbering", data);
      return response;
    } catch (error) {
      console.error("Error updating numbering series:", error);
      throw error;
    }
  },

  /**
   * Get plant configuration
   * @returns {Promise<Object>} Plant configuration response
   */
  async getPlants() {
    try {
      const response = await axios.get("/api/settings/plants");
      return response;
    } catch (error) {
      console.error("Error fetching plant settings:", error);
      throw error;
    }
  },

  /**
   * Update plant configuration
   * @param {Object} data - Plant data
   * @returns {Promise<Object>} Update response
   */
  async updatePlant(data) {
    try {
      const response = await axios.put("/api/settings/plants", data);
      return response;
    } catch (error) {
      console.error("Error updating plant settings:", error);
      throw error;
    }
  }
};

export default settingsApi;