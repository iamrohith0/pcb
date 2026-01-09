import axios from "@/lib/axios";

const API_BASE = "/api/engineering/revisions";

export default {
  async getAll(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async create(revision) {
    const response = await axios.post(API_BASE, revision);
    return response.data;
  },

  async update(id, revision) {
    const response = await axios.put(`${API_BASE}/${id}`, revision);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  async getPrefill(jobCode) {
    const response = await axios.get(`/api/engineering/jobs/${encodeURIComponent(jobCode)}/revisions/meta`);
    return response.data;
  },

  async getRevisionHistory(drawingId, params = {}) {
    const response = await axios.get(`${API_BASE}/drawing/${drawingId}`, { params });
    return response.data;
  },

  async compare(params = {}) {
    const response = await axios.get(`${API_BASE}/compare`, { params });
    return response.data;
  },

  async approveRevision(id) {
    const response = await axios.post(`${API_BASE}/${id}/approve`);
    return response.data;
  },

  async rejectRevision(id, reason) {
    const response = await axios.post(`${API_BASE}/${id}/reject`, { reason });
    return response.data;
  },

  async listEco(params = {}) {
    const response = await axios.get(`${API_BASE}/eco`, { params });
    return response.data;
  },

  async getEcoById(id) {
    const response = await axios.get(`${API_BASE}/eco/${id}`);
    return response.data;
  },

  async createEco(payload) {
    const response = await axios.post(`${API_BASE}/eco`, payload);
    return response.data;
  },

  async approveEco(id) {
    const response = await axios.post(`${API_BASE}/eco/${id}/approve`);
    return response.data;
  },

  async rejectEco(id, reason) {
    const response = await axios.post(`${API_BASE}/eco/${id}/reject`, { reason });
    return response.data;
  },

  async deleteEco(id) {
    const response = await axios.delete(`${API_BASE}/eco/${id}`);
    return response.data;
  }
};
