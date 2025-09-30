const TWO_FACTOR_API_URL = 'https://functions.poehali.dev/e0b23d6a-ea22-444f-b339-b9bb37071cb3';

class TwoFactorAPI {
  private getHeaders(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-Auth-Token': token,
    };
  }

  async getStatus(token: string): Promise<{ two_factor_enabled: boolean }> {
    const response = await fetch(`${TWO_FACTOR_API_URL}?action=status`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get 2FA status');
    }

    return data;
  }

  async enable(token: string): Promise<{ secret: string }> {
    const response = await fetch(`${TWO_FACTOR_API_URL}?action=enable`, {
      method: 'POST',
      headers: this.getHeaders(token),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to enable 2FA');
    }

    return data;
  }

  async generateCode(token: string): Promise<{ code: string; expires_in_minutes: number }> {
    const response = await fetch(`${TWO_FACTOR_API_URL}?action=generate-code`, {
      method: 'POST',
      headers: this.getHeaders(token),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate code');
    }

    return data;
  }

  async confirmEnable(token: string, code: string): Promise<void> {
    const response = await fetch(`${TWO_FACTOR_API_URL}?action=confirm`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to confirm 2FA');
    }
  }

  async verify(token: string, code: string): Promise<{ verified: boolean }> {
    const response = await fetch(`${TWO_FACTOR_API_URL}?action=verify`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to verify code');
    }

    return data;
  }

  async disable(token: string): Promise<void> {
    const response = await fetch(`${TWO_FACTOR_API_URL}?action=disable`, {
      method: 'POST',
      headers: this.getHeaders(token),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to disable 2FA');
    }
  }
}

export const twoFactorAPI = new TwoFactorAPI();