import axios from "@/lib/axios";

const API_BASE = "/api/warehouse/picking";

export default {
  async getAll(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async create(picking) {
    const response = await axios.post(API_BASE, picking);
    return response.data;
  },

  async update(id, picking) {
    const response = await axios.put(`${API_BASE}/${id}`, picking);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  async getPickWavePicking(pickWaveId, params = {}) {
    const response = await axios.get(`${API_BASE}/pickwave/${pickWaveId}`, { params });
    return response.data;
  },

  async updatePickingStatus(id, status) {
    const response = await axios.patch(`${API_BASE}/${id}/status`, { status });
    return response.data;
  },

  async getPickingReport(params = {}) {
    const response = await axios.get(`${API_BASE}/report`, { params });
    return response.data;
  },

  async getPickList(params = {}) {
    const response = await axios.get(`${API_BASE}/pick-list`, { params });
    return response.data;
  }
};