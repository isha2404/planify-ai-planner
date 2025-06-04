import axios, { AxiosInstance } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth-storage");
    if (token) {
      const parsed = JSON.parse(token);
      if (parsed.state.token) {
        config.headers.Authorization = `Bearer ${parsed.state.token}`;
      }
    }
  }
  return config;
});

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface LoginData {
  email: string;
  password: string;
}

interface SignupData extends LoginData {
  name: string;
}

export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/signup", data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  me: async (): Promise<AuthResponse["user"]> => {
    const response = await api.get<AuthResponse["user"]>("/auth/me");
    return response.data;
  },
};

export default api;
