import axios from "@/lib/axios";

const API_BASE = "/api/warehouse/packing";

export default {
  async getAll(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async create(packing) {
    const response = await axios.post(API_BASE, packing);
    return response.data;
  },

  async update(id, packing) {
    const response = await axios.put(`${API_BASE}/${id}`, packing);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  async getPickListPacking(pickListId, params = {}) {
    const response = await axios.get(`${API_BASE}/picklist/${pickListId}`, { params });
    return response.data;
  },

  async updatePackingStatus(id, status) {
    const response = await axios.patch(`${API_BASE}/${id}/status`, { status });
    return response.data;
  },

  async getPackingReport(params = {}) {
    const response = await axios.get(`${API_BASE}/report`, { params });
    return response.data;
  },

  async getPackList(params = {}) {
    const response = await axios.get(`${API_BASE}/pack-list`, { params });
    return response.data;
  }
};