import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import { Lock, User, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login delay
    setTimeout(() => {
      onLogin();
    }, 1500);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={theme === 'light' ? {
        background: 'linear-gradient(135deg, #f0f4ff, #e6f0fd)'
      } : {
        background: 'linear-gradient(to bottom right, #0f172a, #1e293b)'
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          {/* Abstract background elements */}
          {theme === 'dark' ? (
            <>
              <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/20 rounded-full filter blur-3xl"></div>
              <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-600/20 rounded-full filter blur-3xl"></div>
              <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-sky-600/20 rounded-full filter blur-3xl"></div>
            </>
          ) : (
            <>
              <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl"></div>
              <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
              <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-indigo-400/10 rounded-full filter blur-3xl"></div>
            </>
          )}
        </div>
      </div>
      
      <motion.div
        className={`w-full max-w-md backdrop-blur-xl border rounded-xl shadow-2xl overflow-hidden z-10 ${
          theme === 'dark'
            ? 'bg-slate-900/80 border-slate-700/50'
            : 'bg-white/90 border-indigo-200/50'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-auto h-16 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <img 
                src="/Wipro-logo.png" 
                alt="Wipro" 
                className={theme === 'dark' ? "h-10 filter brightness-0 invert" : "h-10"}
              />
            </motion.div>
            <motion.h1
              className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              AWS Migration Agent
            </motion.h1>
            <motion.p
              className={theme === 'dark' ? 'text-slate-400 text-sm' : 'text-slate-500 text-sm'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Sign in to your account to access the migration platform
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
                        theme === 'dark'
                          ? 'border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500'
                          : 'border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className={`block text-sm font-medium ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      Password
                    </label>
                    <a href="#" className={theme === 'dark' ? 'text-sm text-blue-400 hover:text-blue-300' : 'text-sm text-indigo-600 hover:text-indigo-500'}>
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} />
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
                        theme === 'dark'
                          ? 'border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500'
                          : 'border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className={`h-4 w-4 rounded focus:ring-indigo-500 ${
                      theme === 'dark'
                        ? 'border-slate-600 bg-slate-800 text-blue-600'
                        : 'border-slate-300 bg-white text-indigo-600'
                    }`}
                  />
                  <label htmlFor="remember-me" className={`ml-2 block text-sm ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Remember me
                  </label>
                </div>
                
                <div>
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    className="w-full"
                    isLoading={isLoading}
                    icon={!isLoading ? <ArrowRight size={18} /> : undefined}
                  >
                    Sign in
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;