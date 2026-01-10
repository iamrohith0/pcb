import axios from "@/lib/axios";

const API_BASE = "/api/engineering/dfm";

export const dfmApi = {
  // DFM queue
  getQueue: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE}/queue`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching DFM queue:", error);
      throw error;
    }
  },

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
  },

  // DFM review
  getReview: async ({ jobId }) => {
    try {
      const response = await axios.get(`${API_BASE}/review`, { params: { jobId } });
      return response.data;
    } catch (error) {
      console.error("Error fetching DFM review:", error);
      throw error;
    }
  },

  updateReview: async ({ jobId, payload }) => {
    try {
      const response = await axios.put(`${API_BASE}/review/${jobId}`, payload);
      return response.data;
    } catch (error) {
      console.error("Error updating DFM review:", error);
      throw error;
    }
  },

  submitForApproval: async ({ jobId }) => {
    try {
      const response = await axios.post(`${API_BASE}/review/${jobId}/submit`);
      return response.data;
    } catch (error) {
      console.error("Error submitting DFM review for approval:", error);
      throw error;
    }
  },

  approveStep: async ({ jobId, step }) => {
    try {
      const response = await axios.post(`${API_BASE}/review/${jobId}/approve`, { step });
      return response.data;
    } catch (error) {
      console.error("Error approving DFM step:", error);
      throw error;
    }
  },

  // DFM report
  getReport: async ({ jobId }) => {
    try {
      const response = await axios.get(`${API_BASE}/report`, { params: { jobId } });
      return response.data;
    } catch (error) {
      console.error("Error fetching DFM report:", error);
      throw error;
    }
  },

  exportReport: async ({ jobId, format }) => {
    try {
      const response = await axios.get(`${API_BASE}/report/export`, {
        params: { jobId, format },
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("Error exporting DFM report:", error);
      throw error;
    }
  },

  // Gerber file upload and analysis
  uploadGerberFiles: async (files) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await axios.post(`${API_BASE}/gerber/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error uploading Gerber files:", error);
      throw error;
    }
  },

  // Analyze Gerber files for DFM validation
  analyzeGerber: async (files) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await axios.post(`${API_BASE}/gerber/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error analyzing Gerber files:", error);
      throw error;
    }
  },


  // Get capability rules
  getCapabilityRules: async () => {
    try {
      const response = await axios.get(`${API_BASE}/capability-rules`);
      return response.data;
    } catch (error) {
      console.error("Error fetching capability rules:", error);
      throw error;
    }
  },


  // Update capability rules
  updateCapabilityRules: async (rules) => {
    try {
      const response = await axios.put(`${API_BASE}/capability-rules`, rules);
      return response.data;
    } catch (error) {
      console.error("Error updating capability rules:", error);
      throw error;
    }
  },


  // Get DFM recommendations based on analysis
  getRecommendations: async (analysisResult) => {
    try {
      const response = await axios.post(`${API_BASE}/recommendations`, analysisResult);
      return response.data;
    } catch (error) {
      console.error("Error getting DFM recommendations:", error);
      throw error;
    }
  }
};


export default dfmApi;
