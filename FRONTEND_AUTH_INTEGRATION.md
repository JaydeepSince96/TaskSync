# Frontend Authentication Integration Guide

This guide provides examples for integrating the authentication system with your React frontend.

## Setup Instructions

### 1. Install Required Dependencies

```bash
npm install axios js-cookie @types/js-cookie
```

### 2. Create Auth API Service

Create `src/api/auth/auth-api.ts`:

```typescript
// src/api/auth/auth-api.ts
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class AuthAPI {
  private baseURL = BASE_URL;

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await axios.post(`${this.baseURL}/auth/register`, data);
    return response.data;
  }

  // Login user
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await axios.post(`${this.baseURL}/auth/login`, data);
    return response.data;
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await axios.post(`${this.baseURL}/auth/refresh-token`, {
      refreshToken
    });
    return response.data;
  }

  // Logout
  async logout(refreshToken: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(`${this.baseURL}/auth/logout`, {
      refreshToken
    });
    return response.data;
  }

  // Logout from all devices
  async logoutAll(refreshToken: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(`${this.baseURL}/auth/logout-all`, {
      refreshToken
    });
    return response.data;
  }

  // Get user profile
  async getProfile(token: string): Promise<AuthResponse> {
    const response = await axios.get(`${this.baseURL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  // Update profile
  async updateProfile(token: string, data: FormData): Promise<AuthResponse> {
    const response = await axios.put(`${this.baseURL}/auth/profile`, data, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  // Change password
  async changePassword(token: string, data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(`${this.baseURL}/auth/change-password`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  // Delete account
  async deleteAccount(token: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${this.baseURL}/auth/account`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  // Google OAuth login
  googleLogin(): void {
    window.location.href = `${this.baseURL}/auth/google`;
  }
}

export const authAPI = new AuthAPI();
```

### 3. Create Auth Context

Create `src/contexts/AuthContext.tsx`:

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { authAPI, User, AuthResponse } from '../api/auth/auth-api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false, isAuthenticated: false };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateProfile: (data: FormData) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  googleLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing tokens on mount
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = Cookies.get('accessToken');
      const refreshToken = Cookies.get('refreshToken');
      
      if (accessToken && refreshToken) {
        try {
          const response = await authAPI.getProfile(accessToken);
          if (response.success && response.data) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: response.data.user,
                accessToken: accessToken,
                refreshToken: refreshToken,
              },
            });
            return;
          }
        } catch (error) {
          // Try to refresh token
          try {
            const refreshResponse = await authAPI.refreshToken(refreshToken);
            if (refreshResponse.success && refreshResponse.data) {
              Cookies.set('accessToken', refreshResponse.data.accessToken);
              Cookies.set('refreshToken', refreshResponse.data.refreshToken);
              dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                  user: refreshResponse.data.user,
                  accessToken: refreshResponse.data.accessToken,
                  refreshToken: refreshResponse.data.refreshToken,
                },
              });
              return;
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }
        }
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await authAPI.login({ email, password });
      
      if (response.success && response.data) {
        Cookies.set('accessToken', response.data.accessToken);
        Cookies.set('refreshToken', response.data.refreshToken);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          },
        });
        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await authAPI.register({ name, email, password });
      
      if (response.success && response.data) {
        Cookies.set('accessToken', response.data.accessToken);
        Cookies.set('refreshToken', response.data.refreshToken);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          },
        });
        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (state.refreshToken) {
        await authAPI.logout(state.refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const logoutAll = async (): Promise<void> => {
    try {
      if (state.refreshToken) {
        await authAPI.logoutAll(state.refreshToken);
      }
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateProfile = async (data: FormData): Promise<boolean> => {
    try {
      if (!state.accessToken) return false;
      
      const response = await authAPI.updateProfile(state.accessToken, data);
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_USER', payload: response.data.user });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      if (!state.accessToken) return false;
      
      const response = await authAPI.changePassword(state.accessToken, {
        currentPassword,
        newPassword,
      });
      return response.success;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    try {
      if (!state.accessToken) return false;
      
      const response = await authAPI.deleteAccount(state.accessToken);
      if (response.success) {
        dispatch({ type: 'LOGOUT' });
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete account error:', error);
      return false;
    }
  };

  const googleLogin = (): void => {
    authAPI.googleLogin();
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    logoutAll,
    updateProfile,
    changePassword,
    deleteAccount,
    googleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### 4. Create Protected Route Component

Create `src/components/ProtectedRoute.tsx`:

```typescript
// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

### 5. Create Login Component

Create `src/components/auth/LoginForm.tsx`:

```typescript
// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={googleLogin}
          className="mt-4 w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Sign in with Google
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-500 hover:text-blue-700">
          Sign up
        </Link>
      </p>
    </div>
  );
};
```

### 6. Update Your Main App Component

```typescript
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginForm } from './components/auth/LoginForm';
// Import your other components

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            }
          />
          {/* Add more protected routes as needed */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

### 7. Environment Variables

Add to your `.env` file:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## Usage Examples

### Using the Auth Hook

```typescript
import { useAuth } from '../contexts/AuthContext';

function UserProfile() {
  const { user, logout, updateProfile, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <img src={user?.profilePicture} alt="Profile" />
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Making Authenticated API Calls

```typescript
import { useAuth } from '../contexts/AuthContext';
import { taskAPI } from '../api/task/task-api';

function TaskList() {
  const { accessToken } = useAuth();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const loadTasks = async () => {
      if (accessToken) {
        try {
          const response = await taskAPI.getAllTasks(accessToken);
          setTasks(response.data);
        } catch (error) {
          console.error('Failed to load tasks:', error);
        }
      }
    };

    loadTasks();
  }, [accessToken]);

  return (
    <div>
      {tasks.map(task => (
        <div key={task._id}>{task.title}</div>
      ))}
    </div>
  );
}
```

This integration provides a complete authentication system with JWT tokens, Google OAuth, profile management, and proper token refresh handling.
