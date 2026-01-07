import axios from "@/lib/axios";

const API_BASE = "/api/maintenance/equipment";

export default {
  async getAll(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async create(equipment) {
    const response = await axios.post(API_BASE, equipment);
    return response.data;
  },

  async update(id, equipment) {
    const response = await axios.put(`${API_BASE}/${id}`, equipment);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  async getEquipmentHistory(id, params = {}) {
    const response = await axios.get(`${API_BASE}/${id}/history`, { params });
    return response.data;
  },

  async getMaintenanceSchedule(id, params = {}) {
    const response = await axios.get(`${API_BASE}/${id}/maintenance-schedule`, { params });
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await axios.patch(`${API_BASE}/${id}/status`, { status });
    return response.data;
  },

  async getEquipmentReport(params = {}) {
    const response = await axios.get(`${API_BASE}/report`, { params });
    return response.data;
  }
};