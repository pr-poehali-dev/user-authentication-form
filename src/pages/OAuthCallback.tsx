import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import { oauthAPI } from '@/lib/oauth';
import { saveAuth } from '@/lib/auth';
import { emailAPI } from '@/lib/email';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const provider = searchParams.get('provider') as 'google' | 'github';

      if (!code || !provider) {
        setError('Неверные параметры OAuth');
        return;
      }

      try {
        const callbackUrl = `${window.location.origin}/auth/callback`;
        const response = await oauthAPI.handleOAuthCallback(provider, code, callbackUrl);
        
        saveAuth(response.token, response.user);
        
        try {
          await emailAPI.sendWelcomeEmail(
            response.user.email,
            response.user.first_name || 'друг',
            window.location.origin
          );
        } catch (emailErr) {
          console.warn('Failed to send welcome email:', emailErr);
        }
        
        navigate('/profile');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка OAuth авторизации');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <AuthLayout title="Авторизация" subtitle="Обработка входа...">
      <div className="text-center py-8">
        {error ? (
          <div>
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm mb-4">
              {error}
            </div>
            <button
              onClick={() => navigate('/login')}
              className="text-[#667EEA] hover:underline"
            >
              Вернуться к входу
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-[#E0E5EC] rounded-full shadow-neomorph animate-pulse"></div>
            <p className="text-[#718096]">Завершаем вход...</p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}