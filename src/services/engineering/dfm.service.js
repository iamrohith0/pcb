import axios from "@/lib/axios";

const API_BASE = "/api/engineering/dfm";

export const dfmApi = {
  // Save a DFM checklist
  saveChecklist: async (payload) => {
    try {
      const response = await axios.post(`${API_BASE}/checklists`, payload);
      return response.data;
    } catch (error) {
      console.error("Error saving DFM checklist:", error);
      throw error;
    }
  },

  // Get latest DFM checklist by reference
  getLatest: async (params) => {
    try {
      const response = await axios.get(`${API_BASE}/checklists/latest`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching latest DFM checklist:", error);
      throw error;
    }
  },

  // Get DFM checklist by ID
  getById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE}/checklists/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching DFM checklist:", error);
      throw error;
    }
  },

  // Get all DFM checklists with optional filters
  getAll: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE}/checklists`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching DFM checklists:", error);
      throw error;
    }
  },

  // Update an existing DFM checklist
  updateChecklist: async (id, payload) => {
    try {
      const response = await axios.put(`${API_BASE}/checklists/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error("Error updating DFM checklist:", error);
      throw error;
    }
  },

  // Delete a DFM checklist
  deleteChecklist: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/checklists/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting DFM checklist:", error);
      throw error;
    }
  },

  // Export DFM checklist as PDF
  exportPdf: async (id) => {
    try {
      const response = await axios.get(`${API_BASE}/checklists/${id}/export/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error("Error exporting DFM checklist PDF:", error);
      throw error;
    }
  },

  // Get DFM statistics
  getStatistics: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE}/checklists/statistics`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching DFM statistics:", error);
      throw error;
    }
  }
};

export default dfmApi;