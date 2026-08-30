import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import api from "../api/client";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    try {
      const res = await api.get("/api/auth/me");
      setUser(res.data);
    } catch {
      setUser(null);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("token", res.data.access_token);
    await fetchMe();
  }

  async function register(name: string, email: string, password: string) {
    await api.post("/api/auth/register", { name, email, password });
    await login(email, password);
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}