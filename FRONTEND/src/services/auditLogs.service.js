import axios from "@/lib/axios";

const API_BASE = "/api/audit-logs";

export default {
  async getAll(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async search(params = {}) {
    const response = await axios.get(`${API_BASE}/search`, { params });
    return response.data;
  },

  async exportLogs(params = {}) {
    const response = await axios.post(`${API_BASE}/export`, params, {
      responseType: 'blob'
    });
    return response.data;
  },

  async getDetails(id) {
    const response = await axios.get(`${API_BASE}/${id}/details`);
    return response.data;
  },

  async getUserActivity(userId, params = {}) {
    const response = await axios.get(`${API_BASE}/user/${userId}`, { params });
    return response.data;
  },

  async getEntityActivity(entityType, entityId, params = {}) {
    const response = await axios.get(`${API_BASE}/entity/${entityType}/${entityId}`, { params });
    return response.data;
  }
};