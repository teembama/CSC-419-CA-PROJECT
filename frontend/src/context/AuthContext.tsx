import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  date_of_birth?: string;
  phone_number?: string;
  role_id?: number;
  role?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  roles?: {
    id: number;
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const userData = await authAPI.getMe();
      // Normalize user data to have consistent field names
      setUser({
        ...userData,
        // Ensure both naming conventions are available
        first_name: userData.first_name,
        last_name: userData.last_name,
        firstName: userData.first_name,
        lastName: userData.last_name,
        phone_number: userData.phone_number,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        zip_code: userData.zip_code,
        role: userData.roles?.name || userData.role,
      });
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      // Use user data from login response if available
      if (response.user) {
        // Backend returns snake_case fields (first_name, last_name)
        setUser({
          id: response.user.id,
          email: response.user.email,
          first_name: response.user.first_name,
          last_name: response.user.last_name,
          firstName: response.user.first_name,
          lastName: response.user.last_name,
          phone_number: response.user.phone_number,
          address: response.user.address,
          city: response.user.city,
          state: response.user.state,
          zip_code: response.user.zip_code,
          role: response.user.role || response.user.roles?.name,
          role_id: response.user.role_id,
        });
      } else {
        // Fallback to fetching user data
        await refreshUser();
      }
      return { success: true };
    } catch (error: any) {
      const status = error.response?.status;
      const backendMessage = error.response?.data?.message || '';

      // Map to user-friendly error messages
      let friendlyMessage = 'Unable to sign in. Please try again.';

      if (status === 401 || backendMessage.toLowerCase().includes('unauthorized') ||
          backendMessage.toLowerCase().includes('invalid') ||
          backendMessage.toLowerCase().includes('incorrect')) {
        friendlyMessage = 'Incorrect email or password. Please check your credentials and try again.';
      } else if (status === 404 || backendMessage.toLowerCase().includes('not found') ||
                 backendMessage.toLowerCase().includes('no user')) {
        friendlyMessage = 'No account found with this email. Please check your email or create a new account.';
      } else if (status === 429) {
        friendlyMessage = 'Too many login attempts. Please wait a few minutes and try again.';
      } else if (status === 500 || status === 502 || status === 503) {
        friendlyMessage = 'Our servers are temporarily unavailable. Please try again in a few moments.';
      } else if (!navigator.onLine) {
        friendlyMessage = 'No internet connection. Please check your network and try again.';
      }

      return { success: false, error: friendlyMessage };
    }
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    try {
      await authAPI.register(data);
      // Auto-login after registration
      return await login(data.email, data.password);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Still clear local state even if API call fails
      console.error('Logout API error:', error);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
