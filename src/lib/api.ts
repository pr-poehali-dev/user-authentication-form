const API_URL = 'https://functions.poehali.dev/17f386c1-c7a5-4462-913e-738a1e280193';

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ErrorResponse {
  error: string;
}

class AuthAPI {
  private getHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['X-Auth-Token'] = token;
    }
    
    return headers;
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}?action=register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}?action=login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return data;
  }

  async getProfile(token: string): Promise<User> {
    const response = await fetch(`${API_URL}?action=profile`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch profile');
    }

    return data.user;
  }

  async updateProfile(
    token: string,
    firstName: string,
    lastName: string,
    avatarUrl: string
  ): Promise<User> {
    const response = await fetch(`${API_URL}?action=profile`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }

    return data.user;
  }

  async requestPasswordReset(email: string): Promise<{ message: string; reset_token?: string }> {
    const response = await fetch(`${API_URL}?action=reset-password-request`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to request password reset');
    }

    return data;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}?action=reset-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ token, new_password: newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to reset password');
    }

    return data;
  }
}

export const authAPI = new AuthAPI();