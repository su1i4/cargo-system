import { AuthProvider } from "@refinedev/core";
import { axiosInstance } from "@refinedev/nestjsx-crud";
import { API_URL } from "./App";

const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            message: "Ошибка авторизации",
            name: "Invalid credentials",
          },
        };
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("email", data.email);
      localStorage.setItem("role", data.role);
      localStorage.setItem("firstName", data.firstName);
      localStorage.setItem("lastName", data.lastName);
      localStorage.setItem("id", data.id);
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${localStorage.getItem("token")}`;

      return { success: true, redirectTo: "/" };
    } catch (error) {
      return {
        success: false,
        error: {
          message: "Ошибка сервера",
          name: "Server error",
        },
      };
    }
  },

  logout: async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("id");

    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    return localStorage.getItem("access_token")
      ? { authenticated: true }
      : {
          authenticated: false,
          logout: true,
          redirectTo: "/login",
        };
  },

  getPermissions: async () => {
    const role = localStorage.getItem("role");
    return role ? { permissions: role } : null;
  },

  getIdentity: async () => {
    const email = localStorage.getItem("email");
    const firstName = localStorage.getItem("firstName");
    const lastName = localStorage.getItem("lastName");

    if (!email) {
      return null;
    }

    return {
      id: email,
      name: `${firstName} ${lastName}`,
      avatar: "https://www.gravatar.com/avatar/placeholder", // Можно подставить реальный URL
    };
  },

  onError: async (error) => {
    console.error("Auth error:", error);
    if (error.response?.status === 401) {
      return { logout: true };
    }
    return { error };
  },
};

export default authProvider;
