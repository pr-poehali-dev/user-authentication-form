import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import NeomorphButton from '@/components/NeomorphButton';
import { adminAPI, AdminUser, AdminStats } from '@/lib/admin';
import { getToken, getUser } from '@/lib/auth';
import Icon from '@/components/ui/icon';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'users' | 'stats'>('stats');

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    
    if (!token || !user) {
      navigate('/login');
      return;
    }

    loadData();
  }, [page, navigate]);

  const loadData = async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const [statsData, usersData] = await Promise.all([
        adminAPI.getStats(token),
        adminAPI.getUsers(token, page)
      ]);

      setStats(statsData);
      setUsers(usersData.users);
      setTotalPages(usersData.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      if (err instanceof Error && err.message.includes('Admin access')) {
        setTimeout(() => navigate('/profile'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    const token = getToken();
    if (!token) return;

    try {
      await adminAPI.updateUserRole(token, userId, newRole);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка изменения роли');
    }
  };

  const handleStatusChange = async (userId: number, isActive: boolean) => {
    const token = getToken();
    if (!token) return;

    try {
      await adminAPI.updateUserStatus(token, userId, isActive);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка изменения статуса');
    }
  };

  if (loading && !stats) {
    return (
      <AuthLayout title="Админ-панель" subtitle="Загрузка...">
        <div className="text-center text-[#718096]">Загрузка данных...</div>
      </AuthLayout>
    );
  }

  return (
    <div className="min-h-screen bg-[#E0E5EC] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#4A5568]">Админ-панель</h1>
            <p className="text-[#718096] mt-1">Управление пользователями и системой</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-[#718096] hover:text-[#4A5568]"
          >
            <Icon name="ArrowLeft" size={20} />
            <span>Профиль</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm mb-6">
            {error}
          </div>
        )}

        <div className="flex gap-3 mb-6">
          <NeomorphButton
            variant={tab === 'stats' ? 'primary' : 'secondary'}
            onClick={() => setTab('stats')}
          >
            Статистика
          </NeomorphButton>
          <NeomorphButton
            variant={tab === 'users' ? 'primary' : 'secondary'}
            onClick={() => setTab('users')}
          >
            Пользователи
          </NeomorphButton>
        </div>

        {tab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#E0E5EC] rounded-3xl p-6 shadow-neomorph">
              <div className="flex items-center justify-between mb-2">
                <Icon name="Users" size={32} className="text-[#667EEA]" />
                <span className="text-3xl font-bold text-[#4A5568]">{stats.total_users}</span>
              </div>
              <p className="text-sm text-[#718096]">Всего пользователей</p>
            </div>

            <div className="bg-[#E0E5EC] rounded-3xl p-6 shadow-neomorph">
              <div className="flex items-center justify-between mb-2">
                <Icon name="ShieldCheck" size={32} className="text-[#667EEA]" />
                <span className="text-3xl font-bold text-[#4A5568]">{stats.admin_count}</span>
              </div>
              <p className="text-sm text-[#718096]">Администраторов</p>
            </div>

            <div className="bg-[#E0E5EC] rounded-3xl p-6 shadow-neomorph">
              <div className="flex items-center justify-between mb-2">
                <Icon name="Key" size={32} className="text-[#667EEA]" />
                <span className="text-3xl font-bold text-[#4A5568]">{stats.two_factor_enabled_count}</span>
              </div>
              <p className="text-sm text-[#718096]">2FA активирована</p>
            </div>

            <div className="bg-[#E0E5EC] rounded-3xl p-6 shadow-neomorph">
              <div className="flex items-center justify-between mb-2">
                <Icon name="UserCheck" size={32} className="text-[#667EEA]" />
                <span className="text-3xl font-bold text-[#4A5568]">{stats.active_users}</span>
              </div>
              <p className="text-sm text-[#718096]">Активных пользователей</p>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="bg-[#E0E5EC] rounded-3xl p-6 shadow-neomorph">
            <div className="space-y-4">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="bg-white rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#4A5568]">{user.email}</p>
                      {user.two_factor_enabled && (
                        <Icon name="ShieldCheck" size={16} className="text-green-600" />
                      )}
                    </div>
                    {user.first_name && (
                      <p className="text-sm text-[#718096]">
                        {user.first_name} {user.last_name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="px-3 py-2 bg-[#E0E5EC] rounded-xl text-sm shadow-neomorph-inset"
                    >
                      <option value="user">Пользователь</option>
                      <option value="moderator">Модератор</option>
                      <option value="admin">Админ</option>
                    </select>

                    <button
                      onClick={() => handleStatusChange(user.id, !user.is_active)}
                      className={`px-3 py-2 rounded-xl text-sm ${
                        user.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.is_active ? 'Активен' : 'Заблокирован'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <NeomorphButton
                  variant="secondary"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <Icon name="ChevronLeft" size={20} />
                </NeomorphButton>
                <div className="px-4 py-2 text-[#4A5568]">
                  {page} / {totalPages}
                </div>
                <NeomorphButton
                  variant="secondary"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  <Icon name="ChevronRight" size={20} />
                </NeomorphButton>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}