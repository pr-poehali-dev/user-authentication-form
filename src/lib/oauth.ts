const OAUTH_API_URL = 'https://functions.poehali.dev/8e1396a8-a2d8-438c-a755-9345c4d8b0ca';

export interface OAuthInitResponse {
  auth_url: string;
}

export interface OAuthCallbackResponse {
  token: string;
  user: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

class OAuthAPI {
  async initOAuth(provider: 'google' | 'github', callbackUrl: string): Promise<OAuthInitResponse> {
    const response = await fetch(
      `${OAUTH_API_URL}?action=init&provider=${provider}&callback_url=${encodeURIComponent(callbackUrl)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'OAuth init failed');
    }

    return data;
  }

  async handleOAuthCallback(
    provider: 'google' | 'github',
    code: string,
    callbackUrl: string
  ): Promise<OAuthCallbackResponse> {
    const response = await fetch(`${OAUTH_API_URL}?action=callback&provider=${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, callback_url: callbackUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'OAuth callback failed');
    }

    return data;
  }
}

export const oauthAPI = new OAuthAPI();