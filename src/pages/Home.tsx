import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '@/lib/auth';
import NeomorphButton from '@/components/NeomorphButton';
import Icon from '@/components/ui/icon';

export default function Home() {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  return (
    <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-6xl font-bold text-[#4A5568] mb-4">
            Добро пожаловать
          </h1>
          <p className="text-xl text-[#718096]">
            Система авторизации и управления аккаунтом
          </p>
        </div>

        <div className="bg-[#E0E5EC] rounded-3xl p-8 shadow-neomorph mb-8">
          {authenticated ? (
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center gap-3 text-[#667EEA] mb-4">
                <Icon name="CheckCircle" size={32} />
                <p className="text-xl font-medium">Вы авторизованы!</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NeomorphButton 
                  variant="primary"
                  fullWidth
                  onClick={() => navigate('/profile')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Icon name="User" size={20} />
                    <span>Мой профиль</span>
                  </div>
                </NeomorphButton>

                <NeomorphButton 
                  variant="secondary"
                  fullWidth
                  onClick={() => navigate('/settings')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Icon name="Settings" size={20} />
                    <span>Настройки</span>
                  </div>
                </NeomorphButton>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-[#718096]">Войдите или создайте новый аккаунт</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NeomorphButton 
                  variant="primary"
                  fullWidth
                  onClick={() => navigate('/login')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Icon name="LogIn" size={20} />
                    <span>Войти</span>
                  </div>
                </NeomorphButton>

                <NeomorphButton 
                  variant="secondary"
                  fullWidth
                  onClick={() => navigate('/register')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Icon name="UserPlus" size={20} />
                    <span>Регистрация</span>
                  </div>
                </NeomorphButton>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#E0E5EC] rounded-3xl p-8 shadow-neomorph">
          <h2 className="text-2xl font-bold text-[#4A5568] mb-6 text-center">
            Возможности
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#E0E5EC] rounded-2xl shadow-neomorph flex items-center justify-center">
                <Icon name="Lock" size={32} className="text-[#667EEA]" />
              </div>
              <h3 className="font-semibold text-[#4A5568] mb-2">Безопасность</h3>
              <p className="text-sm text-[#718096]">
                JWT токены и шифрование паролей
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#E0E5EC] rounded-2xl shadow-neomorph flex items-center justify-center">
                <Icon name="User" size={32} className="text-[#667EEA]" />
              </div>
              <h3 className="font-semibold text-[#4A5568] mb-2">Профиль</h3>
              <p className="text-sm text-[#718096]">
                Управление личными данными
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#E0E5EC] rounded-2xl shadow-neomorph flex items-center justify-center">
                <Icon name="Mail" size={32} className="text-[#667EEA]" />
              </div>
              <h3 className="font-semibold text-[#4A5568] mb-2">Восстановление</h3>
              <p className="text-sm text-[#718096]">
                Сброс пароля через email
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}