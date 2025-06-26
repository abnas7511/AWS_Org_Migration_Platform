import React from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface StepLogsProps {
  stepId: number;
  isExecuting?: boolean;
  logs: string[];
}

const StepLogs: React.FC<StepLogsProps> = ({ stepId, isExecuting = false, logs = [] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Terminal className={isDark ? "text-slate-400" : "text-indigo-600"} size={20} />
        <h3 className={`text-lg font-medium ${isDark ? "text-white" : "text-slate-800"}`}>
          Execution Logs
        </h3>
        
        {isExecuting && (
          <div className="flex items-center space-x-2 ml-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className={isDark ? "text-green-400" : "text-green-600"} text-sm>Live</span>
          </div>
        )}
      </div>

      {/* Logs Container */}
      <div className={`border rounded-xl overflow-hidden ${
        isDark 
          ? "bg-slate-900/50 border-slate-700/50" 
          : "bg-white/80 border-indigo-200/50 shadow-sm"
      }`}>
        <div className="max-h-96 overflow-y-auto p-4 font-mono">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Terminal className={isDark ? "text-slate-400" : "text-slate-400"} size={32} />
              <p className={isDark ? "text-slate-400" : "text-slate-500"}>No logs available</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-1"
                >
                  <span className="text-green-500">$</span>{" "}
                  <span className={isDark ? "text-slate-300" : "text-slate-700"}>{log}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepLogs;