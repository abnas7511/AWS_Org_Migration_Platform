import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Bot,
  Code,
  FileCode,
  Search,
  Settings,  
  CheckCircle, 
  MoveRight, 
  CheckSquare,
} from 'lucide-react';
import { useMigration } from '../../context/MigrationContext';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import { PhaseType } from '../../types/migration';

const Sidebar: React.FC = () => {
  const { migrationProcess } = useMigration();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeItem, setActiveItem } = useSidebar();
  
  // Update active item based on current location
  useEffect(() => {
    if (location.pathname.startsWith('/phase/')) {
      setActiveItem(location.pathname);
    }
  }, [location.pathname, setActiveItem]);
  
  const menuItems = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <MoveRight size={20} />, label: 'Migration Journey', path: '/migration-journey' }
  ];
  
  const phaseIcons = {
    [PhaseType.ASSESS_EXISTING]: <Search size={20} />,
    [PhaseType.PREPARE_NEW]: <Settings size={20} />,
    [PhaseType.VERIFY_NEW]: <CheckCircle size={20} />,
    [PhaseType.AWS_ATTACH_DETACH]: <FileCode size={20} />,
    [PhaseType.MIGRATION]: <MoveRight size={20} />,
    [PhaseType.POST_MIGRATION]: <CheckSquare size={20} />
  };
  
  return (
    <motion.div
      className="fixed top-0 left-0 h-full w-64 backdrop-blur-sm pt-16 border-r border-indigo-200/50"
      style={theme === 'light' ? {
        background: '-webkit-linear-gradient(55deg, #46368d, #46368d, #4871b6, #4aacdf)'
      } : {
        background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))'
      }}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="p-4">
        <div className="mb-8">
          <h3 className="text-xs font-medium uppercase tracking-wider mb-4 px-4 text-slate-300">
            Main
          </h3>
          <nav>
            <ul className="space-y-1">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <motion.button
                    className={`w-full flex items-center px-4 py-2.5 rounded-lg text-white hover:text-white hover:bg-white/10 ${
                      activeItem === item.path ? 'bg-white/20' : ''
                    }`}
                    onClick={() => {
                      setActiveItem(item.path);
                      navigate(item.path);
                    }}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={`mr-3 ${activeItem === item.path ? 'text-white' : 'text-slate-300'}`}>{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider mb-4 px-4 text-slate-300">
            Migration Phases
          </h3>
          <nav className="max-h-[calc(100vh-220px)] overflow-y-auto pr-2 pb-4">
            <ul className="space-y-1">
              {migrationProcess.phases.map((phase) => (
                <li key={phase.id}>
                  <motion.button
                    className={`w-full flex items-center px-4 py-2.5 rounded-lg ${
                      activeItem === `/phase/${phase.type}`
                        ? 'bg-white/20 text-white'
                        : 'text-white hover:bg-white/10'
                    }`}
                    onClick={() => {
                      setActiveItem(`/phase/${phase.type}`);
                      navigate(`/phase/${phase.type}`);
                    }}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={`mr-3 ${
                      activeItem === `/phase/${phase.type}`
                        ? 'text-white'
                        : 'text-slate-300'
                    }`}>
                      {phaseIcons[phase.type]}
                    </span>
                    <div className="flex-1">
                      <span className="font-medium block">{phase.title}</span>
                    </div>
                  </motion.button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;









//ab