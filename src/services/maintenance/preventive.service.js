import axios from "@/lib/axios";

const API_BASE = "/api/maintenance/preventive";

export default {
  async getAll(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async create(maintenance) {
    const response = await axios.post(API_BASE, maintenance);
    return response.data;
  },

  async update(id, maintenance) {
    const response = await axios.put(`${API_BASE}/${id}`, maintenance);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  async getEquipmentSchedule(equipmentId, params = {}) {
    const response = await axios.get(`${API_BASE}/equipment/${equipmentId}`, { params });
    return response.data;
  },

  async getScheduleHistory(equipmentId, params = {}) {
    const response = await axios.get(`${API_BASE}/history/${equipmentId}`, { params });
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await axios.patch(`${API_BASE}/${id}/status`, { status });
    return response.data;
  },

  async getMaintenanceReport(params = {}) {
    const response = await axios.get(`${API_BASE}/report`, { params });
    return response.data;
  },

  async getUpcomingTasks(params = {}) {
    const response = await axios.get(`${API_BASE}/upcoming`, { params });
    return response.data;
  }
};