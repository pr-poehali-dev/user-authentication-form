import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import NeomorphInput from '@/components/NeomorphInput';
import NeomorphButton from '@/components/NeomorphButton';
import { authAPI } from '@/lib/api';
import { emailAPI } from '@/lib/email';
import Icon from '@/components/ui/icon';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');
  
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetTokenDisplay, setResetTokenDisplay] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authAPI.requestPasswordReset(email);
      setSuccess('Ссылка для сброса пароля отправлена на email!');
      if (response.reset_token) {
        setResetTokenDisplay(response.reset_token);
        
        try {
          await emailAPI.sendPasswordResetEmail(
            email,
            response.reset_token,
            `${window.location.origin}/reset-password`
          );
        } catch (emailErr) {
          console.warn('Failed to send reset email:', emailErr);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }

    if (!resetToken) {
      setError('Токен сброса не найден');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(resetToken, newPassword);
      setSuccess('Пароль успешно изменен!');
      
      try {
        await emailAPI.sendPasswordChangedEmail(email);
      } catch (emailErr) {
        console.warn('Failed to send password changed email:', emailErr);
      }
      
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сброса пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={resetToken ? 'Новый пароль' : 'Восстановление пароля'} 
      subtitle={resetToken ? 'Введите новый пароль' : 'Введите email для восстановления'}
    >
      {!resetToken ? (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <NeomorphInput
            type="email"
            label="Email"
            placeholder="your@email.com"
            icon="Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 text-green-700 px-4 py-3 rounded-2xl text-sm">
              {success}
              {resetTokenDisplay && (
                <div className="mt-2 p-2 bg-white rounded-lg">
                  <p className="text-xs font-mono break-all">
                    Токен для теста: {resetTokenDisplay}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/reset-password?token=${resetTokenDisplay}`)}
                    className="text-blue-600 underline text-xs mt-1"
                  >
                    Использовать токен
                  </button>
                </div>
              )}
            </div>
          )}

          <NeomorphButton type="submit" fullWidth disabled={loading}>
            {loading ? 'Отправка...' : 'Отправить ссылку'}
          </NeomorphButton>

          <div className="text-center space-y-3 mt-6">
            <div className="flex items-center justify-center gap-2 text-sm text-[#718096]">
              <span>Вспомнили пароль?</span>
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
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <NeomorphInput
            type="password"
            label="Новый пароль"
            placeholder="••••••••"
            icon="Lock"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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

          {success && (
            <div className="bg-green-100 text-green-700 px-4 py-3 rounded-2xl text-sm">
              {success}
            </div>
          )}

          <NeomorphButton type="submit" fullWidth disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить пароль'}
          </NeomorphButton>

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
      )}
    </AuthLayout>
  );
}