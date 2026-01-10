import api from "@/lib/axios";

export const permissionsService = {
  // List permissions with filters
  async list(params = {}) {
    try {
      const response = await api.get("/api/admin/permissions", { params });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      throw error;
    }
  },

  // Get single permission
  async get(id) {
    try {
      const response = await api.get(`/api/admin/permissions/${id}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch permission:", error);
      throw error;
    }
  },

  // Create permission
  async create(payload) {
    try {
      const response = await api.post("/api/admin/permissions", payload);
      return response.data;
    } catch (error) {
      console.error("Failed to create permission:", error);
      throw error;
    }
  },

  // Update permission
  async update(id, payload) {
    try {
      const response = await api.put(`/api/admin/permissions/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error("Failed to update permission:", error);
      throw error;
    }
  },

  // Delete permission
  async delete(id) {
    try {
      await api.delete(`/api/admin/permissions/${id}`);
    } catch (error) {
      console.error("Failed to delete permission:", error);
      throw error;
    }
  },

  // Bulk delete permissions
  async bulkDelete(ids) {
    try {
      await api.delete("/api/admin/permissions/bulk", {
        data: { ids }
      });
    } catch (error) {
      console.error("Failed to bulk delete permissions:", error);
      throw error;
    }
  },

  // Toggle permission status
  async toggleStatus(id) {
    try {
      const response = await api.put(`/api/admin/permissions/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error("Failed to toggle permission status:", error);
      throw error;
    }
  },

  // Search permissions
  async search(query) {
    try {
      const response = await api.get("/api/admin/permissions/search", {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error("Failed to search permissions:", error);
      throw error;
    }
  },

  // Get permissions by module
  async getByModule(module) {
    try {
      const response = await api.get(`/api/admin/permissions/module/${module}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch permissions by module:", error);
      throw error;
    }
  },

  // Get active permissions by module
  async getActiveByModule(module) {
    try {
      const response = await api.get(`/api/admin/permissions/module/${module}/active`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch active permissions by module:", error);
      throw error;
    }
  },

  // Get system permissions
  async getSystemPermissions() {
    try {
      const response = await api.get("/api/admin/permissions/system");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch system permissions:", error);
      throw error;
    }
  },

  // Get custom permissions
  async getCustomPermissions() {
    try {
      const response = await api.get("/api/admin/permissions/custom");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch custom permissions:", error);
      throw error;
    }
  },

  // Get all modules
  async getAllModules() {
    try {
      const response = await api.get("/api/admin/permissions/modules");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch modules:", error);
      throw error;
    }
  },

  // Get all operations
  async getAllOperations() {
    try {
      const response = await api.get("/api/admin/permissions/operations");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch operations:", error);
      throw error;
    }
  },

  // Get permission statistics
  async getStats() {
    try {
      const response = await api.get("/api/admin/permissions/stats");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch permission stats:", error);
      throw error;
    }
  },

  // Export permissions to CSV
  async exportCsv(params = {}) {
    try {
      const response = await api.get("/api/admin/permissions/export/csv", {
        params,
        responseType: "blob"
      });
      return response.data;
    } catch (error) {
      console.error("Failed to export permissions:", error);
      throw error;
    }
  }
};