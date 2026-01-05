import axios from "@/lib/axios";

const API_BASE = "/api/traceability/batch";

export default {
  async getAll(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async create(batch) {
    const response = await axios.post(API_BASE, batch);
    return response.data;
  },

  async update(id, batch) {
    const response = await axios.put(`${API_BASE}/${id}`, batch);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  async registerBatch(batchData) {
    const response = await axios.post(`${API_BASE}/register`, batchData);
    return response.data;
  },

  async getBatchHistory(id, params = {}) {
    const response = await axios.get(`${API_BASE}/${id}/history`, { params });
    return response.data;
  },

  async getBatchTraceability(id) {
    const response = await axios.get(`${API_BASE}/${id}/traceability`);
    return response.data;
  },

  async scanBatch(scanData) {
    const response = await axios.post(`${API_BASE}/scan`, scanData);
    return response.data;
  }
};