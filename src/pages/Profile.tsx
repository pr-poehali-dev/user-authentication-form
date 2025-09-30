import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import NeomorphInput from '@/components/NeomorphInput';
import NeomorphButton from '@/components/NeomorphButton';
import { authAPI, User } from '@/lib/api';
import { getToken, clearAuth, getUser as getCachedUser, saveAuth } from '@/lib/auth';
import Icon from '@/components/ui/icon';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(getCachedUser());
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    const loadProfile = async () => {
      try {
        const profileData = await authAPI.getProfile(token);
        setUser(profileData);
        setFirstName(profileData.first_name || '');
        setLastName(profileData.last_name || '');
        setAvatarUrl(profileData.avatar_url || '');
      } catch (err) {
        setError('Не удалось загрузить профиль');
        clearAuth();
        navigate('/login');
      }
    };

    loadProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const token = getToken();
    if (!token) return;

    try {
      const updatedUser = await authAPI.updateProfile(token, firstName, lastName, avatarUrl);
      setUser(updatedUser);
      saveAuth(token, updatedUser);
      setSuccess('Профиль успешно обновлен!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  if (!user) {
    return (
      <AuthLayout title="Загрузка...">
        <div className="text-center text-[#718096]">Загрузка профиля...</div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Профиль" 
      subtitle={`Добро пожаловать, ${user.first_name || user.email}!`}
    >
      <div className="mb-6 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-[#E0E5EC] shadow-neomorph flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            <Icon name="User" size={48} className="text-[#A3B1C6]" />
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <NeomorphInput
          type="text"
          label="Имя"
          placeholder="Иван"
          icon="User"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />

        <NeomorphInput
          type="text"
          label="Фамилия"
          placeholder="Иванов"
          icon="User"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        <NeomorphInput
          type="email"
          label="Email"
          value={user.email}
          disabled
          icon="Mail"
        />

        <NeomorphInput
          type="url"
          label="Ссылка на аватар"
          placeholder="https://example.com/avatar.jpg"
          icon="Image"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
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
          {loading ? 'Сохранение...' : 'Сохранить изменения'}
        </NeomorphButton>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <NeomorphButton 
            type="button" 
            variant="secondary" 
            fullWidth
            onClick={() => navigate('/settings')}
          >
            Настройки
          </NeomorphButton>
          
          {user.email && (
            <NeomorphButton 
              type="button" 
              variant="secondary" 
              fullWidth
              onClick={() => navigate('/admin')}
            >
              Админ
            </NeomorphButton>
          )}
          
          <NeomorphButton 
            type="button" 
            variant="secondary" 
            fullWidth
            onClick={handleLogout}
            className="col-span-2"
          >
            Выйти
          </NeomorphButton>
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