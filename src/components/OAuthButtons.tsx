import { useState } from 'react';
import NeomorphButton from './NeomorphButton';
import Icon from '@/components/ui/icon';
import { oauthAPI } from '@/lib/oauth';

interface OAuthButtonsProps {
  onSuccess: (token: string, user: any) => void;
  onError: (error: string) => void;
}

export default function OAuthButtons({ onSuccess, onError }: OAuthButtonsProps) {
  const [loading, setLoading] = useState(false);

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/auth/callback`;
      const { auth_url } = await oauthAPI.initOAuth(provider, callbackUrl);
      
      window.location.href = auth_url;
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Ошибка OAuth');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#CBD5E0]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[#E0E5EC] text-[#718096]">или войти через</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NeomorphButton
          type="button"
          variant="secondary"
          onClick={() => handleOAuth('google')}
          disabled={loading}
          className="flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
            <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
          </svg>
          <span>Google</span>
        </NeomorphButton>

        <NeomorphButton
          type="button"
          variant="secondary"
          onClick={() => handleOAuth('github')}
          disabled={loading}
          className="flex items-center justify-center gap-2"
        >
          <Icon name="Github" size={18} />
          <span>GitHub</span>
        </NeomorphButton>
      </div>
    </div>
  );
}