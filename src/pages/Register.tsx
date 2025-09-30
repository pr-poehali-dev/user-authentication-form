import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import NeomorphInput from '@/components/NeomorphInput';
import NeomorphButton from '@/components/NeomorphButton';
import OAuthButtons from '@/components/OAuthButtons';
import { authAPI } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import { emailAPI } from '@/lib/email';
import Icon from '@/components/ui/icon';

export default function Register() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register(email, password, firstName, lastName);
      saveAuth(response.token, response.user);
      
      try {
        await emailAPI.sendWelcomeEmail(email, firstName || 'друг', window.location.origin);
      } catch (emailErr) {
        console.warn('Failed to send welcome email:', emailErr);
      }
      
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSuccess = (token: string, user: any) => {
    saveAuth(token, user);
    navigate('/');
  };

  const handleOAuthError = (error: string) => {
    setError(error);
  };

  return (
    <AuthLayout 
      title="Регистрация" 
      subtitle="Создайте новый аккаунт"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <NeomorphInput
          type="text"
          label="Имя"
          placeholder="Иван"
          icon="User"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />

        <NeomorphInput
          type="text"
          label="Фамилия"
          placeholder="Иванов"
          icon="User"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />

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

        <NeomorphInput
          type="password"
          label="Подтвердите пароль"
          placeholder="••••••••"
          icon="Lock"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm">
            {error}
          </div>
        )}

        <NeomorphButton type="submit" fullWidth disabled={loading}>
          {loading ? 'Загрузка...' : 'Зарегистрироваться'}
        </NeomorphButton>

        <OAuthButtons onSuccess={handleOAuthSuccess} onError={handleOAuthError} />

        <div className="text-center space-y-3 mt-6">
          <div className="flex items-center justify-center gap-2 text-sm text-[#718096]">
            <span>Уже есть аккаунт?</span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[#667EEA] hover:underline font-medium"
            >
              Войти
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