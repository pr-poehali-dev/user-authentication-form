import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import NeomorphInput from '@/components/NeomorphInput';
import NeomorphButton from '@/components/NeomorphButton';
import OAuthButtons from '@/components/OAuthButtons';
import { authAPI } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import Icon from '@/components/ui/icon';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      saveAuth(response.token, response.user);
      sessionStorage.setItem('just_logged_in', 'true');
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSuccess = (token: string, user: any) => {
    saveAuth(token, user);
    sessionStorage.setItem('just_logged_in', 'true');
    navigate('/');
  };

  const handleOAuthError = (error: string) => {
    setError(error);
  };

  return (
    <AuthLayout 
      title="Вход" 
      subtitle="Войдите в свой аккаунт"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <NeomorphInput
          type="email"
          label="Email"
          placeholder="your@email.com"
          icon="Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <NeomorphInput
          type="password"
          label="Пароль"
          placeholder="••••••••"
          icon="Lock"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm">
            {error}
          </div>
        )}

        <NeomorphButton type="submit" fullWidth disabled={loading}>
          {loading ? 'Загрузка...' : 'Войти'}
        </NeomorphButton>

        <OAuthButtons onSuccess={handleOAuthSuccess} onError={handleOAuthError} />

        <div className="text-center space-y-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/reset-password')}
            className="text-[#667EEA] hover:underline text-sm"
          >
            Забыли пароль?
          </button>
          
          <div className="flex items-center justify-center gap-2 text-sm text-[#718096]">
            <span>Нет аккаунта?</span>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-[#667EEA] hover:underline font-medium"
            >
              Зарегистрироваться
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[#CBD5E0]">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 text-[#718096] hover:text-[#4A5568] mx-auto"
          >
            <Icon name="Home" size={20} />
            <span>На главную</span>
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}