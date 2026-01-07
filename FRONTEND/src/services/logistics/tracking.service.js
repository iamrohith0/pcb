import axios from "@/lib/axios";

const API_BASE = "/api/logistics/tracking";

export default {
  async getTrackingInfo(trackingId) {
    const response = await axios.get(`${API_BASE}/${trackingId}`);
    return response.data;
  },

  async getShipmentTracking(shipmentId) {
    const response = await axios.get(`${API_BASE}/shipment/${shipmentId}`);
    return response.data;
  },

  async getPackageTracking(packageId) {
    const response = await axios.get(`${API_BASE}/package/${packageId}`);
    return response.data;
  },

  async updateTrackingStatus(trackingId, status) {
    const response = await axios.patch(`${API_BASE}/${trackingId}/status`, { status });
    return response.data;
  },

  async getTrackingHistory(trackingId, params = {}) {
    const response = await axios.get(`${API_BASE}/${trackingId}/history`, { params });
    return response.data;
  },

  async getRealTimeLocation(trackingId) {
    const response = await axios.get(`${API_BASE}/${trackingId}/location`);
    return response.data;
  },

  async getDeliveryEstimate(trackingId) {
    const response = await axios.get(`${API_BASE}/${trackingId}/estimate`);
    return response.data;
  }
};