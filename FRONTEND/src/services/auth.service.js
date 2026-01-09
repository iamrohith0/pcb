import api from "../lib/axios";

const authService = {
  async login(credentials) {
    try {
      const response = await api.post("/auth/login", credentials);
      const { accessToken, user } = response.data;

      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      return { user };
    } catch (error) {
      throw error;
    }
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },

  async getCurrentUser() {
    try {
      const response = await api.get("/auth/me");
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default authService;
