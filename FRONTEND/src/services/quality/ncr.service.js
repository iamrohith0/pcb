// src/services/quality/ncr.service.js
import axios from "@/lib/axios";

const API_BASE = "/api/quality/ncr";

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

  async exportPdf(id) {
    const res = await axios.get(`${API_BASE}/${id}/export/pdf`, {
      responseType: "blob",
    });
    return res;
  },
};