const ADMIN_API_URL = 'https://functions.poehali.dev/de0fba6f-e587-458d-a220-b88fd6e72298';

export interface AdminUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  two_factor_enabled: boolean;
  created_at?: string;
}

export interface AdminStats {
  total_users: number;
  admin_count: number;
  two_factor_enabled_count: number;
  active_users: number;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  email: string;
  action: string;
  ip_address?: string;
  created_at: string;
}

class AdminAPI {
  private getHeaders(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-Auth-Token': token,
    };
  }

  async getUsers(token: string, page: number = 1): Promise<{ users: AdminUser[]; total: number; pages: number }> {
    const response = await fetch(`${ADMIN_API_URL}?action=users&page=${page}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch users');
    }

    return data;
  }

  async updateUserRole(token: string, userId: number, role: string): Promise<void> {
    const response = await fetch(`${ADMIN_API_URL}?action=user-role`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify({ user_id: userId, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update role');
    }
  }

  async updateUserStatus(token: string, userId: number, isActive: boolean): Promise<void> {
    const response = await fetch(`${ADMIN_API_URL}?action=user-status`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify({ user_id: userId, is_active: isActive }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update status');
    }
  }

  async getActivityLog(token: string, page: number = 1): Promise<{ logs: ActivityLog[]; total: number; pages: number }> {
    const response = await fetch(`${ADMIN_API_URL}?action=activity-log&page=${page}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch activity log');
    }

    return data;
  }

  async getStats(token: string): Promise<AdminStats> {
    const response = await fetch(`${ADMIN_API_URL}?action=stats`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch stats');
    }

    return data;
  }
}

export const adminAPI = new AdminAPI();