// src/services/quality/inspections.service.js
import axios from "@/lib/axios";

const API_BASE = "/api/quality/inspections";

export default {
  async list(params = {}) {
    const res = await axios.get(API_BASE, { params });
    return res;
  },

  async get(id) {
    const res = await axios.get(`${API_BASE}/${id}`);
    return res;
  },

  async create(payload) {
    const res = await axios.post(API_BASE, payload);
    return res;
  },

  async update(id, payload) {
    const res = await axios.put(`${API_BASE}/${id}`, payload);
    return res;
  },

  async remove(id) {
    const res = await axios.delete(`${API_BASE}/${id}`);
    return res;
  },

  async exportCsv(params = {}) {
    const res = await axios.get(`${API_BASE}/export/csv`, {
      params,
      responseType: "blob",
    });
    return res;
  },
};