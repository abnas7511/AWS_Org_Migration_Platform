import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  const { theme } = useTheme();
  
  return (
    <div
      className={`
        rounded-xl border backdrop-blur-sm
        ${theme === 'dark' 
          ? 'bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50 text-white' 
          : 'bg-white border-indigo-200/50 text-slate-800 shadow-md'
        }
        ${className}
      `}
      style={{ paddingLeft: '15px', paddingTop: '5px', paddingBottom:'5px' }}
    >
      {children}
    </div>
  );
};

export default Card;










//ab