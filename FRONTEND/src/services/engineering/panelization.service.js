// src/services/engineering/panelization.service.js
import axios from "@/lib/axios";

/**
 * Panelization API service
 * Handles panel templates, panel creation, and panelization operations
 */
const panelizationApi = {
  /**
   * Get all panel templates
   * @returns {Promise<Object>} Templates response
   */
  async listTemplates() {
    try {
      const response = await axios.get("/api/engineering/panelization/templates");
      return response.data;
    } catch (error) {
      console.error("Error fetching panel templates:", error);
      throw error;
    }
  },

  /**
   * Get a specific panel template by ID
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Template response
   */
  async getTemplate(templateId) {
    try {
      const response = await axios.get(`/api/engineering/panelization/templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching panel template:", error);
      throw error;
    }
  },

  /**
   * Create a new panel template
   * @param {Object} data - Template data
   * @returns {Promise<Object>} Create response
   */
  async createTemplate(data) {
    try {
      const response = await axios.post("/api/engineering/panelization/templates", data);
      return response.data;
    } catch (error) {
      console.error("Error creating panel template:", error);
      throw error;
    }
  },

  /**
   * Update an existing panel template
   * @param {string} templateId - Template ID
   * @param {Object} data - Template data
   * @returns {Promise<Object>} Update response
   */
  async updateTemplate(templateId, data) {
    try {
      const response = await axios.put(`/api/engineering/panelization/templates/${templateId}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating panel template:", error);
      throw error;
    }
  },

  /**
   * Duplicate a panel template
   * @param {Object} data - Duplicate data with templateId
   * @returns {Promise<Object>} Duplicate response
   */
  async duplicateTemplate(data) {
    try {
      const response = await axios.post("/api/engineering/panelization/templates/duplicate", data);
      return response.data;
    } catch (error) {
      console.error("Error duplicating panel template:", error);
      throw error;
    }
  },

  /**
   * Delete a panel template
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Delete response
   */
  async deleteTemplate(templateId) {
    try {
      const response = await axios.delete(`/api/engineering/panelization/templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting panel template:", error);
      throw error;
    }
  },

  /**
   * Get all panels
   * @returns {Promise<Object>} Panels response
   */
  async listPanels() {
    try {
      const response = await axios.get("/api/engineering/panelization/panels");
      return response.data;
    } catch (error) {
      console.error("Error fetching panels:", error);
      throw error;
    }
  },

  /**
   * Get a specific panel by ID
   * @param {string} panelId - Panel ID
   * @returns {Promise<Object>} Panel response
   */
  async getPanel(panelId) {
    try {
      const response = await axios.get(`/api/engineering/panelization/panels/${panelId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching panel:", error);
      throw error;
    }
  },

  /**
   * Create a new panel
   * @param {Object} data - Panel data
   * @returns {Promise<Object>} Create response
   */
  async createPanel(data) {
    try {
      const response = await axios.post("/api/engineering/panelization/panels", data);
      return response.data;
    } catch (error) {
      console.error("Error creating panel:", error);
      throw error;
    }
  },

  /**
   * Update an existing panel
   * @param {string} panelId - Panel ID
   * @param {Object} data - Panel data
   * @returns {Promise<Object>} Update response
   */
  async updatePanel(panelId, data) {
    try {
      const response = await axios.put(`/api/engineering/panelization/panels/${panelId}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating panel:", error);
      throw error;
    }
  },

  /**
   * Delete a panel
   * @param {string} panelId - Panel ID
   * @returns {Promise<Object>} Delete response
   */
  async deletePanel(panelId) {
    try {
      const response = await axios.delete(`/api/engineering/panelization/panels/${panelId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting panel:", error);
      throw error;
    }
  },

  /**
   * Generate panel layout from template
   * @param {string} templateId - Template ID
   * @param {Object} options - Layout options
   * @returns {Promise<Object>} Layout response
   */
  async generateLayout(templateId, options) {
    try {
      const response = await axios.post(`/api/engineering/panelization/templates/${templateId}/generate`, options);
      return response.data;
    } catch (error) {
      console.error("Error generating panel layout:", error);
      throw error;
    }
  },

  /**
   * Get panelization reports
   * @param {Object} filters - Report filters
   * @returns {Promise<Object>} Reports response
   */
  async getReports(filters = {}) {
    try {
      const response = await axios.get("/api/engineering/panelization/reports", { params: filters });
      return response.data;
    } catch (error) {
      console.error("Error fetching panelization reports:", error);
      throw error;
    }
  },

  async getJobSnapshot(jobId) {
    try {
      const response = await axios.get(`/api/engineering/panelization/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching panelization job snapshot:", error);
      throw error;
    }
  },

  async downloadPanelReport(panelId) {
    try {
      const response = await axios.get(`/api/engineering/panelization/panels/${panelId}/report`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("Error downloading panel report:", error);
      throw error;
    }
  }
};

export default panelizationApi;
