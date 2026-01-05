import axios from "@/lib/axios";

const API_BASE = "/api/maintenance/spares";

export default {
  async getAll(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async create(spare) {
    const response = await axios.post(API_BASE, spare);
    return response.data;
  },

  async update(id, spare) {
    const response = await axios.put(`${API_BASE}/${id}`, spare);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  async getEquipmentSpares(equipmentId, params = {}) {
    const response = await axios.get(`${API_BASE}/equipment/${equipmentId}`, { params });
    return response.data;
  },

  async getStockLevels(params = {}) {
    const response = await axios.get(`${API_BASE}/stock-levels`, { params });
    return response.data;
  },

  async updateStock(id, stockData) {
    const response = await axios.patch(`${API_BASE}/${id}/stock`, stockData);
    return response.data;
  },

  async getUsageReport(params = {}) {
    const response = await axios.get(`${API_BASE}/usage-report`, { params });
    return response.data;
  }
};