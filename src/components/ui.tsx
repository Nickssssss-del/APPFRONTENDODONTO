import { type ButtonHTMLAttributes, type ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm shadow-primary-500/30',
    secondary: 'bg-slatey-900 text-white hover:bg-slatey-800',
    outline: 'border-2 border-slatey-200 text-slatey-700 hover:border-primary-400 hover:text-primary-600 bg-white',
    ghost: 'text-slatey-600 hover:bg-slatey-100',
    danger: 'bg-error-500 text-white hover:bg-error-600 shadow-sm shadow-error-500/30',
    success: 'bg-success-500 text-white hover:bg-success-600 shadow-sm shadow-success-500/30',
  };
  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-5 py-3 text-sm rounded-2xl',
    lg: 'px-6 py-4 text-base rounded-2xl',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

type BadgeProps = {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
};

export function Badge({ children, variant = 'neutral', size = 'sm', className = '' }: BadgeProps) {
  const variants = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    success: 'bg-success-50 text-success-700 border-success-100',
    warning: 'bg-warning-50 text-warning-600 border-warning-100',
    error: 'bg-error-50 text-error-700 border-error-100',
    neutral: 'bg-slatey-100 text-slatey-600 border-slatey-200',
    accent: 'bg-accent-50 text-accent-700 border-accent-200',
  };
  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, className = '' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="absolute inset-0 bg-slatey-900/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide ${className}`}
          >
            {title && (
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slatey-100 bg-white rounded-t-3xl">
                <h3 className="text-lg font-bold text-slatey-900 font-display">{title}</h3>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-slatey-100 transition-colors">
                  <X className="w-5 h-5 text-slatey-500" />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type ToggleProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
};

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${checked ? 'bg-primary-500' : 'bg-slatey-300'}`}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md ${checked ? 'left-6' : 'left-1'}`}
      />
    </button>
  );
}

type InputProps = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: ReactNode;
  maxLength?: number;
  className?: string;
};

export function Input({ label, value, onChange, placeholder, type = 'text', icon, maxLength, className = '' }: InputProps) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-semibold text-slatey-700 mb-1.5">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slatey-400">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full px-4 py-3.5 rounded-2xl border-2 border-slatey-200 bg-slatey-50 text-slatey-900 placeholder:text-slatey-400 focus:border-primary-400 focus:bg-white focus:outline-none transition-all ${icon ? 'pl-11' : ''}`}
        />
      </div>
    </div>
  );
}

type ScreenWrapperProps = {
  children: ReactNode;
  className?: string;
};

export function ScreenWrapper({ children, className = '' }: ScreenWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className={`min-h-screen bg-slatey-50 ${className}`}
    >
      {children}
    </motion.div>
  );
}

type TopBarProps = {
  title: string;
  onBack?: () => void;
  rightAction?: ReactNode;
};

export function TopBar({ title, onBack, rightAction }: TopBarProps) {
  return (
    <div className="sticky top-0 z-30 glass border-b border-slatey-100">
      <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-slatey-100 transition-colors">
              <svg className="w-5 h-5 text-slatey-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className="text-lg font-bold text-slatey-900 font-display">{title}</h2>
        </div>
        {rightAction}
      </div>
    </div>
  );
}
