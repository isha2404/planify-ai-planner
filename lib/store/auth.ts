import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        set({ token, user, isAuthenticated: true });
        // Update axios default headers and localStorage
        if (typeof window !== "undefined") {
          const authData = { state: { token, user, isAuthenticated: true } };
          localStorage.setItem("auth-storage", JSON.stringify(authData));
          // The cookie will be set by the server response
          document.cookie = `token=${token}; path=/; secure; samesite=lax`;
        }
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");
          localStorage.removeItem("token");
        }
      },
    }),
    {
      name: "auth-storage",
      skipHydration: true,
    }
  )
);
