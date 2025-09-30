import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-[#4A5568] mb-2">{title}</h1>
          {subtitle && (
            <p className="text-[#718096]">{subtitle}</p>
          )}
        </div>
        <div className="bg-[#E0E5EC] rounded-3xl p-8 shadow-neomorph">
          {children}
        </div>
      </div>
    </div>
  );
}