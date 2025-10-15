import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authAPI } from "@/lib/api";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "librarian" | "member";
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getProfile();
      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  function getCookieValue(name) {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [key, value] = cookie.trim().split("=");
      if (key === name) return decodeURIComponent(value);
    }
    return null;
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { access_token } = response.data;
      const refresh_token = getCookieValue("refresh_token");
      console.log("Token:", refresh_token);

      console.log("Login response data:", response.data);
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);

      await fetchUser();
      toast.success("Welcome back!");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error || "Invalid credentials";
      toast.error(message);
      throw error;
    }
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    try {
      await authAPI.register(data);
      toast.success("Registration successful! Please log in.");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error || "Registration failed";
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    toast.info("Logged out successfully");
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
