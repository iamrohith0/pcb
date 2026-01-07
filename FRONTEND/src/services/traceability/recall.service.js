import axios from "@/lib/axios";

const API_BASE = "/api/traceability/recall";

export default {
  async getAll(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async create(recall) {
    const response = await axios.post(API_BASE, recall);
    return response.data;
  },

  async update(id, recall) {
    const response = await axios.put(`${API_BASE}/${id}`, recall);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  async getRecallImpact(recallId, params = {}) {
    const response = await axios.get(`${API_BASE}/${recallId}/impact`, { params });
    return response.data;
  },

  async getRecallCases(params = {}) {
    const response = await axios.get(`${API_BASE}/cases`, { params });
    return response.data;
  },

  async getRecallReports(params = {}) {
    const response = await axios.get(`${API_BASE}/reports`, { params });
    return response.data;
  },

  async initiateRecall(recallData) {
    const response = await axios.post(`${API_BASE}/initiate`, recallData);
    return response.data;
  }
};