import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import NeomorphInput from '@/components/NeomorphInput';
import NeomorphButton from '@/components/NeomorphButton';
import { twoFactorAPI } from '@/lib/twoFactor';
import { getToken } from '@/lib/auth';
import Icon from '@/components/ui/icon';

export default function TwoFactorSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'init' | 'verify'>('init');
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    const checkStatus = async () => {
      try {
        const status = await twoFactorAPI.getStatus(token);
        setEnabled(status.two_factor_enabled);
      } catch (err) {
        console.error('Failed to check 2FA status:', err);
      }
    };

    checkStatus();
  }, [navigate]);

  const handleEnable = async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const response = await twoFactorAPI.enable(token);
      setSecret(response.secret);

      const codeResponse = await twoFactorAPI.generateCode(token);
      setGeneratedCode(codeResponse.code);
      
      setStep('verify');
      setSuccess('Код отправлен! Введите его для подтверждения.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка активации 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      await twoFactorAPI.confirmEnable(token, code);
      setSuccess('2FA успешно активирована!');
      setTimeout(() => navigate('/settings'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    const token = getToken();
    if (!token) return;

    if (!confirm('Вы уверены, что хотите отключить двухфакторную аутентификацию?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await twoFactorAPI.disable(token);
      setSuccess('2FA отключена');
      setEnabled(false);
      setTimeout(() => navigate('/settings'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отключения 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={enabled ? 'Управление 2FA' : 'Настройка 2FA'} 
      subtitle={enabled ? 'Двухфакторная аутентификация активна' : 'Повысьте безопасность аккаунта'}
    >
      {enabled ? (
        <div className="space-y-6">
          <div className="bg-green-100 text-green-800 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
            <Icon name="ShieldCheck" size={20} />
            <span>Двухфакторная аутентификация включена</span>
          </div>

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

          <NeomorphButton 
            variant="secondary" 
            fullWidth 
            onClick={handleDisable}
            disabled={loading}
            className="!text-red-600"
          >
            {loading ? 'Отключение...' : 'Отключить 2FA'}
          </NeomorphButton>

          <div className="pt-4 border-t border-[#CBD5E0]">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="flex items-center justify-center gap-2 text-[#718096] hover:text-[#4A5568] mx-auto"
            >
              <Icon name="ArrowLeft" size={20} />
              <span>Назад в настройки</span>
            </button>
          </div>
        </div>
      ) : step === 'init' ? (
        <div className="space-y-6">
          <div className="bg-[#E0E5EC] rounded-2xl p-4 shadow-neomorph-inset">
            <h3 className="font-semibold text-[#4A5568] mb-2 flex items-center gap-2">
              <Icon name="Shield" size={20} />
              Что такое 2FA?
            </h3>
            <p className="text-sm text-[#718096]">
              Двухфакторная аутентификация добавляет дополнительный уровень защиты вашему аккаунту. 
              При входе вам понадобится ввести код подтверждения.
            </p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm">
              {error}
            </div>
          )}

          <NeomorphButton fullWidth onClick={handleEnable} disabled={loading}>
            {loading ? 'Активация...' : 'Активировать 2FA'}
          </NeomorphButton>

          <div className="pt-4 border-t border-[#CBD5E0]">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="flex items-center justify-center gap-2 text-[#718096] hover:text-[#4A5568] mx-auto"
            >
              <Icon name="ArrowLeft" size={20} />
              <span>Назад в настройки</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="bg-[#E0E5EC] rounded-2xl p-4 shadow-neomorph-inset">
            <p className="text-sm text-[#718096] mb-3">
              Для теста, ваш код подтверждения:
            </p>
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-[#667EEA] tracking-wider">
                {generatedCode}
              </p>
            </div>
            <p className="text-xs text-[#A0AEC0] mt-2">
              Код действителен 10 минут
            </p>
          </div>

          <NeomorphInput
            type="text"
            label="Введите код подтверждения"
            placeholder="123456"
            icon="Key"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
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
            {loading ? 'Проверка...' : 'Подтвердить'}
          </NeomorphButton>

          <NeomorphButton 
            type="button" 
            variant="secondary" 
            fullWidth 
            onClick={() => setStep('init')}
          >
            Отмена
          </NeomorphButton>
        </form>
      )}
    </AuthLayout>
  );
}