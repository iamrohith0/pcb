import axios from "@/lib/axios";

const API_BASE = "/api/warehouse/locations";

export default {
  async getAll(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async create(location) {
    const response = await axios.post(API_BASE, location);
    return response.data;
  },

  async update(id, location) {
    const response = await axios.put(`${API_BASE}/${id}`, location);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  async getWarehouseLocations(warehouseId, params = {}) {
    const response = await axios.get(`${API_BASE}/warehouse/${warehouseId}`, { params });
    return response.data;
  },

  async getLocationStock(locationId, params = {}) {
    const response = await axios.get(`${API_BASE}/${locationId}/stock`, { params });
    return response.data;
  },

  async updateLocationCapacity(id, capacity) {
    const response = await axios.patch(`${API_BASE}/${id}/capacity`, { capacity });
    return response.data;
  },

  async getLocationReport(params = {}) {
    const response = await axios.get(`${API_BASE}/report`, { params });
    return response.data;
  }
};