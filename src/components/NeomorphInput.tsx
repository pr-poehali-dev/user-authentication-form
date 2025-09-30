import { InputHTMLAttributes, forwardRef } from 'react';
import Icon from '@/components/ui/icon';

interface NeomorphInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

const NeomorphInput = forwardRef<HTMLInputElement, NeomorphInputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium text-[#4A5568] mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#718096]">
              <Icon name={icon} size={20} />
            </div>
          )}
          <input
            ref={ref}
            className={`w-full px-4 py-3 ${icon ? 'pl-12' : ''} bg-[#E0E5EC] rounded-2xl shadow-neomorph-inset text-[#4A5568] placeholder-[#A0AEC0] focus:outline-none focus:ring-2 focus:ring-[#A3B1C6] transition-all ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

NeomorphInput.displayName = 'NeomorphInput';

export default NeomorphInput;