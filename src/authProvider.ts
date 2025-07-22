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
      localStorage.setItem("cargo-system-token", data.access_token);
      localStorage.setItem("cargo-system-refresh-token", data.refresh_token);
      localStorage.setItem("cargo-system-email", data.email);
      localStorage.setItem("cargo-system-role", data.role);
      localStorage.setItem("cargo-system-firstName", data.firstName);
      localStorage.setItem("cargo-system-lastName", data.lastName);
      localStorage.setItem("cargo-system-id", data.id);
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${localStorage.getItem("cargo-system-token")}`;

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
    localStorage.removeItem("cargo-system-token");
    localStorage.removeItem("cargo-system-refresh-token");
    localStorage.removeItem("cargo-system-email");
    localStorage.removeItem("cargo-system-role");
    localStorage.removeItem("cargo-system-firstName");
    localStorage.removeItem("cargo-system-lastName");
    localStorage.removeItem("cargo-system-id");

    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    return localStorage.getItem("cargo-system-token")
      ? { authenticated: true }
      : {
          authenticated: false,
          logout: true,
          redirectTo: "/login",
        };
  },

  getPermissions: async () => {
    const role = localStorage.getItem("cargo-system-role");
    return role ? { permissions: role } : null;
  },

  getIdentity: async () => {
    const email = localStorage.getItem("cargo-system-email");
    const firstName = localStorage.getItem("cargo-system-firstName");
    const lastName = localStorage.getItem("cargo-system-lastName");

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
    if (error.response?.status === 401) {
      return { logout: true };
    }
    return { error };
  },
};

export default authProvider;
