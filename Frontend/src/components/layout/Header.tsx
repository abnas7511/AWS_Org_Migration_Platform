import React from 'react';
import { motion } from 'framer-motion';
import { UserCircle, LogOut, Moon, Sun, HelpCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-slate-900/95 to-slate-800/95 border-slate-700/50' 
          : 'border-indigo-200/50'
      }`}
      style={theme === 'light' ? {
        background: '-webkit-linear-gradient(25deg, #46368d, #46368d, #4871b6, #4aacdf)'
      } : {}}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
    >
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <motion.div
            className="mr-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src="/Wipro-logo.png" 
              alt="Wipro" 
              className="h-10 filter brightness-0 invert"
            />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold text-white">
              AWS Account Migration
            </h1>
            <p className="text-xs text-slate-200">
              Automated Organization Migration
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <motion.button 
              className="p-2 rounded-full transition-colors text-white hover:text-slate-100 hover:bg-white/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Help and Documentation"
            >
              <HelpCircle size={18} />
            </motion.button>
            <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg overflow-hidden z-20 hidden group-hover:block ${
              theme === 'dark' ? 'bg-slate-800' : 'bg-white'
            }`}>
              <div className="py-1">
                <button 
                  onClick={() => navigate('/api-details')}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    theme === 'dark' 
                      ? 'text-white hover:bg-slate-700' 
                      : 'text-gray-700 hover:bg-indigo-100'
                  }`}
                >
                  API Docs
                </button>
                <button 
                  onClick={() => navigate('/terraform-details')}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    theme === 'dark' 
                      ? 'text-white hover:bg-slate-700' 
                      : 'text-gray-700 hover:bg-indigo-100'
                  }`}
                >
                  Terraform Docs
                </button>
              </div>
            </div>
          </div>
          
          <motion.button 
            className="p-2 rounded-full transition-colors text-white hover:text-slate-100 hover:bg-white/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </motion.button>
          
          <div className="flex items-center">
            <motion.div
              className="flex items-center cursor-pointer group"
              whileHover={{ scale: 1.02 }}
            >
              <div className="mr-2 text-right hidden sm:block">
                <p className="text-sm font-medium text-white">
                  User@org.com
                </p>
                <p className="text-xs text-slate-200">
                  Admin
                </p>
              </div>
              <div className="relative">
                <UserCircle className="h-8 w-8 text-white" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-indigo-800"></span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;