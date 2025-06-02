"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/store/auth";

export function AuthHydration() {
  const setAuth = useAuth((state) => state.setAuth);

  useEffect(() => {
    // Check if we have auth data in localStorage
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      try {
        const { state: { token, user } } = JSON.parse(authStorage);
        if (token && user) {
          setAuth(token, user);
        }
      } catch (error) {
        console.error("Error hydrating auth state:", error);
      }
    }
  }, [setAuth]);

  return null;
}
