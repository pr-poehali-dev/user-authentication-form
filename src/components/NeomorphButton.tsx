import { ButtonHTMLAttributes, ReactNode } from 'react';

interface NeomorphButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

export default function NeomorphButton({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}: NeomorphButtonProps) {
  const baseStyles = 'px-6 py-3 rounded-2xl font-medium transition-all duration-200 active:shadow-neomorph-inset disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = variant === 'primary' 
    ? 'bg-[#A3B1C6] text-white shadow-neomorph hover:shadow-neomorph-sm'
    : 'bg-[#E0E5EC] text-[#4A5568] shadow-neomorph hover:shadow-neomorph-sm';
  
  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseStyles} ${variantStyles} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}