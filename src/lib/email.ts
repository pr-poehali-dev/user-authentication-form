const EMAIL_API_URL = 'https://functions.poehali.dev/9e72ce3d-fa65-46d8-9ee4-ae52d1f6daf9';

interface EmailData {
  name?: string;
  app_url?: string;
  reset_token?: string;
  reset_url?: string;
}

class EmailAPI {
  async sendWelcomeEmail(toEmail: string, name: string, appUrl: string): Promise<void> {
    await this.sendEmail('welcome', toEmail, { name, app_url: appUrl });
  }

  async sendPasswordResetEmail(
    toEmail: string,
    resetToken: string,
    resetUrl: string
  ): Promise<void> {
    await this.sendEmail('password_reset', toEmail, { reset_token: resetToken, reset_url: resetUrl });
  }

  async sendPasswordChangedEmail(toEmail: string): Promise<void> {
    await this.sendEmail('password_changed', toEmail, {});
  }

  private async sendEmail(type: string, toEmail: string, data: EmailData): Promise<void> {
    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, to_email: toEmail, data }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send email');
    }
  }
}

export const emailAPI = new EmailAPI();