// src/services/quality/inspection-templates.service.js
import axios from "@/lib/axios";

const API_BASE = "/api/quality/inspection-templates";

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

  async exportJson() {
    const res = await axios.get(`${API_BASE}/export/json`, {
      responseType: "blob",
    });
    return res;
  },
};