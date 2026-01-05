import axios from "@/lib/axios";

const API_BASE = "/api/maintenance/breakdowns";

export default {
  async getAll(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async create(breakdown) {
    const response = await axios.post(API_BASE, breakdown);
    return response.data;
  },

  async update(id, breakdown) {
    const response = await axios.put(`${API_BASE}/${id}`, breakdown);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  async getEquipmentBreakdowns(equipmentId, params = {}) {
    const response = await axios.get(`${API_BASE}/equipment/${equipmentId}`, { params });
    return response.data;
  },

  async getBreakdownHistory(equipmentId, params = {}) {
    const response = await axios.get(`${API_BASE}/history/${equipmentId}`, { params });
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await axios.patch(`${API_BASE}/${id}/status`, { status });
    return response.data;
  },

  async getMTTRReport(params = {}) {
    const response = await axios.get(`${API_BASE}/mttr-report`, { params });
    return response.data;
  },

  async getMTBFReport(params = {}) {
    const response = await axios.get(`${API_BASE}/mtbf-report`, { params });
    return response.data;
  }
};