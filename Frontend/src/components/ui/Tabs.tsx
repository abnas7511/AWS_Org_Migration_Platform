import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  children: React.ReactNode;
  className?: string;
  actionButtons?: React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  defaultTab, 
  onTabChange, 
  children, 
  className = '',
  actionButtons
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`border-b ${isDark ? 'border-slate-700/50' : 'border-indigo-200/50'}`}>
        <nav className="flex justify-between items-center">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative py-3 px-1 text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? isDark 
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-indigo-600 border-b-2 border-indigo-600'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-300'
                      : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {tab.icon && <span>{tab.icon}</span>}
                  <span>{tab.label}</span>
                </div>
                
                {activeTab === tab.id && (
                  <motion.div
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-blue-400' : 'bg-indigo-600'}`}
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="action-buttons" style={{ padding: '15px' }}>
            {actionButtons}
          </div>
        </nav>
      </div>
      
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
};

interface TabPanelProps {
  tabId: string;
  activeTab: string;
  children: React.ReactNode;
}

export const TabPanel: React.FC<TabPanelProps> = ({ tabId, activeTab, children }) => {
  if (tabId !== activeTab) return null;
  
  return (
    <motion.div
      key={tabId}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export default Tabs;