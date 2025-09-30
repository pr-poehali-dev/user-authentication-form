import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import NeomorphButton from '@/components/NeomorphButton';
import { User } from '@/lib/api';
import { getToken, clearAuth, getUser as getCachedUser } from '@/lib/auth';
import Icon from '@/components/ui/icon';

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(getCachedUser());

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleDeleteAccount = () => {
    if (confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) {
      clearAuth();
      navigate('/');
    }
  };

  if (!user) {
    return (
      <AuthLayout title="Загрузка...">
        <div className="text-center text-[#718096]">Загрузка...</div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Настройки" 
      subtitle="Управление аккаунтом"
    >
      <div className="space-y-4">
        <div className="bg-[#E0E5EC] rounded-2xl p-4 shadow-neomorph-inset">
          <h3 className="font-semibold text-[#4A5568] mb-2">Информация об аккаунте</h3>
          <div className="space-y-2 text-sm text-[#718096]">
            <div className="flex justify-between">
              <span>Email:</span>
              <span className="font-medium text-[#4A5568]">{user.email}</span>
            </div>
            {user.created_at && (
              <div className="flex justify-between">
                <span>Дата регистрации:</span>
                <span className="font-medium text-[#4A5568]">
                  {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <NeomorphButton 
            variant="secondary" 
            fullWidth
            onClick={() => navigate('/profile')}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon name="User" size={20} />
              <span>Редактировать профиль</span>
            </div>
          </NeomorphButton>

          <NeomorphButton 
            variant="secondary" 
            fullWidth
            onClick={() => navigate('/reset-password')}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon name="Lock" size={20} />
              <span>Изменить пароль</span>
            </div>
          </NeomorphButton>

          <NeomorphButton 
            variant="secondary" 
            fullWidth
            onClick={handleDeleteAccount}
            className="!text-red-600"
          >
            <div className="flex items-center justify-center gap-2">
              <Icon name="Trash2" size={20} />
              <span>Удалить аккаунт</span>
            </div>
          </NeomorphButton>
        </div>

        <div className="mt-6 pt-6 border-t border-[#CBD5E0] space-y-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center justify-center gap-2 text-[#718096] hover:text-[#4A5568] mx-auto"
          >
            <Icon name="ArrowLeft" size={20} />
            <span>Назад в профиль</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 text-[#718096] hover:text-[#4A5568] mx-auto"
          >
            <Icon name="Home" size={20} />
            <span>На главную</span>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}