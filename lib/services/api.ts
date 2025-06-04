import axios, { AxiosInstance } from "axios";
import { JWTPayload } from "../auth";
import { Event } from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if it exists
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const authStorage = localStorage.getItem("auth-storage");
    const token = authStorage ? JSON.parse(authStorage).state.token : null;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData extends LoginData {
  name: string;
}

export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>(
      "/api/auth/login",
      data
    );
    return response.data;
  },

  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>(
      "/api/auth/signup",
      data
    );
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post("/api/auth/logout");
  },

  me: async (): Promise<AuthResponse["user"]> => {
    const response = await axiosInstance.get<AuthResponse["user"]>(
      "/api/auth/me"
    );
    return response.data;
  },
};

export const eventsApi = {
  getAll: async (): Promise<Event[]> => {
    const response = await axiosInstance.get<Event[]>("/api/events");
    return response.data;
  },

  getOne: async (id: string): Promise<Event> => {
    const response = await axiosInstance.get<Event>(`/api/events/${id}`);
    return response.data;
  },

  create: async (event: Omit<Event, "id">): Promise<Event> => {
    const response = await axiosInstance.post<Event>("/api/events", event);
    return response.data;
  },

  update: async (id: string, event: Partial<Event>): Promise<Event> => {
    const response = await axiosInstance.put<Event>(`/api/events/${id}`, event);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/api/events/${id}`);
  },
};

// Export all APIs
export const api = {
  auth: authApi,
  events: eventsApi,
};

export default api;
