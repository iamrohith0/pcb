import axios from "@/lib/axios";

const API_BASE = "/api/serials";

export default {
  async getAll(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getById(serialId) {
    const response = await axios.get(`${API_BASE}/${serialId}`);
    return response.data;
  },

  async create(serialData) {
    const response = await axios.post(API_BASE, serialData);
    return response.data;
  },

  async update(serialId, serialData) {
    const response = await axios.put(`${API_BASE}/${serialId}`, serialData);
    return response.data;
  },

  async delete(serialId) {
    const response = await axios.delete(`${API_BASE}/${serialId}`);
    return response.data;
  },

  async registerBatch(serials) {
    const response = await axios.post(`${API_BASE}/register-batch`, { serials });
    return response.data;
  },

  async printLabels(serialIds, templateId) {
    const response = await axios.post(`${API_BASE}/print-labels`, {
      serialIds,
      templateId
    });
    return response.data;
  },

  async lookup(serialNumber) {
    const response = await axios.get(`${API_BASE}/lookup/${serialNumber}`);
    return response.data;
  },

  async getHistory(serialId) {
    const response = await axios.get(`${API_BASE}/${serialId}/history`);
    return response.data;
  }
};