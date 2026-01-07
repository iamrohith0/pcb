import axios from "@/lib/axios";

const API_BASE = "/api/logistics/shipments";

export default {
  async getAll(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async create(shipment) {
    const response = await axios.post(API_BASE, shipment);
    return response.data;
  },

  async update(id, shipment) {
    const response = await axios.put(`${API_BASE}/${id}`, shipment);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  async getShipmentHistory(orderId, params = {}) {
    const response = await axios.get(`${API_BASE}/order/${orderId}`, { params });
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await axios.patch(`${API_BASE}/${id}/status`, { status });
    return response.data;
  },

  async getTrackingInfo(id) {
    const response = await axios.get(`${API_BASE}/${id}/tracking`);
    return response.data;
  },

  async getShipmentReport(params = {}) {
    const response = await axios.get(`${API_BASE}/report`, { params });
    return response.data;
  }
};