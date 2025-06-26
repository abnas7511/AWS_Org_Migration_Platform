import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xs' | 'icon' | 'icon-xs';
  className?: string;
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  isLoading = false,
  disabled = false,
  icon,
  type = 'button',
}) => {
  const { theme } = useTheme();
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return theme === 'dark'
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-indigo-600 hover:bg-indigo-700 text-white';
      case 'secondary':
        return theme === 'dark'
          ? 'bg-slate-700 hover:bg-slate-600 text-white'
          : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800';
      case 'outline':
        return theme === 'dark'
          ? 'bg-transparent border border-slate-600 hover:bg-slate-800/50 text-slate-300 hover:text-white'
          : 'bg-transparent border border-indigo-300 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800';
      case 'ghost':
        return theme === 'dark'
          ? 'bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-white'
          : 'bg-transparent hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800';
      case 'warning':
        return theme === 'dark'
          ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-600/30'
          : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200';
      default:
        return theme === 'dark'
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-indigo-600 hover:bg-indigo-700 text-white';
    }
  };
  
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'text-xs px-[13px] py-[1px] rounded';
      case 'sm':
        return 'text-sm px-3 py-1.5 rounded-md';
      case 'md':
        return 'text-sm px-4 py-2 rounded-md';
      case 'lg':
        return 'text-base px-5 py-2.5 rounded-lg';
      case 'icon':
        return 'p-2 rounded-full';
      case 'icon-xs':
        return 'p-1 rounded-full';
      default:
        return 'text-sm px-4 py-2 rounded-md';
    }
  };
  
  return (
    <motion.button
      type={type}
      className={`
        inline-flex items-center justify-center font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${disabled || isLoading ? 'opacity-60 cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || isLoading}
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
    >
      {isLoading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {!isLoading && icon && (
        <span className={children ? 'mr-2' : ''}>{icon}</span>
      )}
      {children}
    </motion.button>
  );
};

export default Button;