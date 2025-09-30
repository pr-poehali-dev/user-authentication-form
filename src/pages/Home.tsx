import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getUser } from '@/lib/auth';
import { useEffect, useState, useRef } from 'react';
import NeomorphButton from '@/components/NeomorphButton';
import Icon from '@/components/ui/icon';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Home() {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();
  const user = getUser();
  const [showWelcome, setShowWelcome] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem('just_logged_in');
    if (justLoggedIn === 'true') {
      setShowWelcome(true);
      sessionStorage.removeItem('just_logged_in');
      
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (authenticated && messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Привет${user?.firstName ? ', ' + user.firstName : ''}! 👋\n\nЯ — ИИ-ассистент для создания сайтов. Просто опишите, какой сайт вы хотите создать, и я помогу воплотить вашу идею в реальность!\n\n**Примеры запросов:**\n• Создай лендинг для кофейни с меню и контактами\n• Сделай портфолио фотографа с галереей работ\n• Нужен интернет-магазин косметики с корзиной\n• Создай блог о путешествиях с красивым дизайном\n\nОпишите свою идею, и мы начнём! ✨`,
        timestamp: new Date()
      }]);
    }
  }, [authenticated, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const responses = [
        'Отличная идея! Я создам для вас красивый сайт с современным дизайном. Начинаю работу... 🎨',
        'Понял! Сейчас разработаю структуру сайта и подберу подходящую цветовую схему. 🚀',
        'Замечательно! Я учту все ваши пожелания и создам уникальный дизайн. Момент... ✨',
        'Прекрасно! Приступаю к созданию вашего сайта с учётом современных трендов веб-дизайна. 💫'
      ];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const quickPrompts = [
    { icon: 'Coffee', text: 'Лендинг для кафе', prompt: 'Создай лендинг для кофейни с меню, галереей и контактами' },
    { icon: 'ShoppingBag', text: 'Интернет-магазин', prompt: 'Сделай интернет-магазин с каталогом товаров и корзиной' },
    { icon: 'Camera', text: 'Портфолио', prompt: 'Создай портфолио фотографа с галереей работ' },
    { icon: 'Briefcase', text: 'Корпоративный сайт', prompt: 'Разработай корпоративный сайт с информацией о компании' }
  ];

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-6xl font-bold text-[#4A5568] mb-4">
              Создавайте сайты с ИИ
            </h1>
            <p className="text-xl text-[#718096]">
              Опишите свою идею — мы создадим готовый сайт за минуты
            </p>
          </div>

          <div className="bg-[#E0E5EC] rounded-3xl p-8 shadow-neomorph mb-8">
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-[#718096]">Войдите, чтобы начать создавать сайты</p>
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
          </div>

          <div className="bg-[#E0E5EC] rounded-3xl p-8 shadow-neomorph">
            <h2 className="text-2xl font-bold text-[#4A5568] mb-6 text-center">
              Возможности
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#E0E5EC] rounded-2xl shadow-neomorph flex items-center justify-center">
                  <Icon name="Sparkles" size={32} className="text-[#667EEA]" />
                </div>
                <h3 className="font-semibold text-[#4A5568] mb-2">ИИ-генерация</h3>
                <p className="text-sm text-[#718096]">
                  Создание сайтов по текстовому описанию
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#E0E5EC] rounded-2xl shadow-neomorph flex items-center justify-center">
                  <Icon name="Palette" size={32} className="text-[#667EEA]" />
                </div>
                <h3 className="font-semibold text-[#4A5568] mb-2">Современный дизайн</h3>
                <p className="text-sm text-[#718096]">
                  Красивые и адаптивные макеты
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#E0E5EC] rounded-2xl shadow-neomorph flex items-center justify-center">
                  <Icon name="Zap" size={32} className="text-[#667EEA]" />
                </div>
                <h3 className="font-semibold text-[#4A5568] mb-2">Быстро</h3>
                <p className="text-sm text-[#718096]">
                  Готовый сайт за несколько минут
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E0E5EC] flex flex-col">
      <header className="bg-[#E0E5EC] border-b border-[#CBD5E0] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#667EEA] to-[#764BA2] rounded-2xl flex items-center justify-center shadow-neomorph">
              <Icon name="Sparkles" size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#4A5568]">ИИ Конструктор Сайтов</h1>
              <p className="text-xs text-[#718096]">Создавайте сайты через диалог</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="p-2 bg-[#E0E5EC] rounded-xl shadow-neomorph hover:shadow-neomorph-inset transition-all"
              title="Профиль"
            >
              <Icon name="User" size={20} className="text-[#667EEA]" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 bg-[#E0E5EC] rounded-xl shadow-neomorph hover:shadow-neomorph-inset transition-all"
              title="Настройки"
            >
              <Icon name="Settings" size={20} className="text-[#718096]" />
            </button>
          </div>
        </div>
      </header>

      {showWelcome && (
        <div className="max-w-6xl mx-auto px-4 pt-4 w-full">
          <div className="bg-gradient-to-r from-[#667EEA] to-[#764BA2] rounded-2xl p-4 shadow-neomorph animate-fade-in">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Icon name="Sparkles" size={20} />
                </div>
                <div>
                  <p className="font-semibold">
                    Привет, {user?.firstName || user?.email}! 👋
                  </p>
                  <p className="text-sm opacity-90">
                    Готов создавать сайты вместе!
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowWelcome(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`flex gap-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-neomorph ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-br from-[#667EEA] to-[#764BA2]' 
                    : 'bg-[#E0E5EC]'
                }`}>
                  <Icon 
                    name={message.role === 'user' ? 'User' : 'Bot'} 
                    size={20} 
                    className={message.role === 'user' ? 'text-white' : 'text-[#667EEA]'}
                  />
                </div>
                
                <div className={`px-6 py-4 rounded-2xl shadow-neomorph ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-br from-[#667EEA] to-[#764BA2] text-white' 
                    : 'bg-[#E0E5EC] text-[#4A5568]'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-[#718096]'}`}>
                    {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-[#E0E5EC] rounded-2xl flex items-center justify-center shadow-neomorph">
                  <Icon name="Bot" size={20} className="text-[#667EEA]" />
                </div>
                <div className="px-6 py-4 rounded-2xl shadow-neomorph bg-[#E0E5EC]">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-[#667EEA] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-[#667EEA] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-[#667EEA] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-[#E0E5EC] border-t border-[#CBD5E0] sticky bottom-0">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {messages.length <= 1 && (
            <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInput(prompt.prompt)}
                  className="p-3 bg-[#E0E5EC] rounded-xl shadow-neomorph hover:shadow-neomorph-inset transition-all text-left"
                >
                  <div className="flex items-center gap-2 text-sm text-[#4A5568]">
                    <Icon name={prompt.icon as any} size={16} className="text-[#667EEA]" />
                    <span className="font-medium">{prompt.text}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Опишите, какой сайт вы хотите создать..."
                className="w-full px-6 py-4 rounded-2xl bg-[#E0E5EC] shadow-neomorph-inset text-[#4A5568] placeholder-[#A0AEC0] focus:outline-none focus:ring-2 focus:ring-[#667EEA]/30 transition-all"
                disabled={isTyping}
              />
            </div>
            
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="px-6 py-4 bg-gradient-to-br from-[#667EEA] to-[#764BA2] text-white rounded-2xl shadow-neomorph hover:shadow-neomorph-inset transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Icon name="Send" size={20} />
              <span className="hidden md:inline">Отправить</span>
            </button>
          </form>
          
          <p className="text-center text-xs text-[#A0AEC0] mt-3">
            ИИ может делать ошибки. Проверяйте важную информацию.
          </p>
        </div>
      </div>
    </div>
  );
}
