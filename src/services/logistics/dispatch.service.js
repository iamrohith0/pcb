import axios from "@/lib/axios";

const API_BASE = "/api/logistics/dispatch";

export default {
  async getAll(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async create(dispatch) {
    const response = await axios.post(API_BASE, dispatch);
    return response.data;
  },

  async update(id, dispatch) {
    const response = await axios.put(`${API_BASE}/${id}`, dispatch);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  async getDispatchHistory(orderId, params = {}) {
    const response = await axios.get(`${API_BASE}/order/${orderId}`, { params });
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await axios.patch(`${API_BASE}/${id}/status`, { status });
    return response.data;
  },

  async getDispatchReport(params = {}) {
    const response = await axios.get(`${API_BASE}/report`, { params });
    return response.data;
  },

  async getUpcomingDispatches(params = {}) {
    const response = await axios.get(`${API_BASE}/upcoming`, { params });
    return response.data;
  }
};