import axios from "@/lib/axios";

// Note: axios baseURL is http://localhost:8080/api, so don't include /api prefix here
const API_BASE = "warehouse/warehouses";

export default {
  async getAll(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async create(warehouse) {
    const response = await axios.post(API_BASE, warehouse);
    return response.data;
  },

  async update(id, warehouse) {
    const response = await axios.put(`${API_BASE}/${id}`, warehouse);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  async getWarehouseStock(warehouseId, params = {}) {
    const response = await axios.get(`${API_BASE}/${warehouseId}/stock`, { params });
    return response.data;
  },

  async getWarehouseReport(params = {}) {
    const response = await axios.get(`${API_BASE}/report`, { params });
    return response.data;
  },

  async getWarehouseCapacity(warehouseId) {
    const response = await axios.get(`${API_BASE}/${warehouseId}/capacity`);
    return response.data;
  }
};