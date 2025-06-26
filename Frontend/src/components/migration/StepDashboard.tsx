import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, XCircle, BarChart3, Activity } from 'lucide-react';
import { MigrationStep, StepStatus } from '../../types/migration';
import Card from '../ui/Card';
import { useTheme } from '../../context/ThemeContext';

interface StepDashboardProps {
  step: MigrationStep;
  results?: any;
  onLoadResults?: () => void;
}

const HIDDEN_KEYS = ['success', 'summary', 'organization', 'message'];

const renderValue = (value: any, isDark: boolean) => {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="italic text-slate-400">None</span>;
    return (
      <ul className="list-disc ml-6">
        {value.map((item, idx) => (
          <li key={idx}>
            {typeof item === 'object' && item !== null
              ? <div className="mb-2">{renderObject(item, isDark)}</div>
              : String(item)}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === 'object' && value !== null) {
    return renderObject(value, isDark);
  }
  return <span>{String(value)}</span>;
};

const renderObject = (obj: any, isDark: boolean) => (
  <div className="pl-2">
    {Object.entries(obj)
      .filter(([k]) => !HIDDEN_KEYS.includes(k))
      .map(([k, v]) => (
        <div key={k} className="mb-1">
          <span className="font-semibold">{k}: </span>
          {renderValue(v, isDark)}
        </div>
      ))}
  </div>
);

const renderDynamicResults = (result: any, isDark: boolean) => (
  <div className="space-y-6">
    {Object.entries(result)
      .filter(([section]) => !HIDDEN_KEYS.includes(section))
      .map(([section, items]) => (
        <div key={section}>
          <div className={`mb-2 text-base font-bold uppercase tracking-wide ${isDark ? "text-slate-100" : "text-slate-800"}`}>{section}</div>
          {Array.isArray(items) && items.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className={`rounded-lg p-4 border ${isDark ? "bg-slate-800/70 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"} shadow`}
                >
                  {renderObject(item, isDark)}
                </div>
              ))}
            </div>
          ) : (
            <div className={`italic ${isDark ? "text-slate-400" : "text-slate-500"}`}>No data found.</div>
          )}
        </div>
      ))}
  </div>
);

const StepDashboard: React.FC<StepDashboardProps> = ({ step, results, onLoadResults }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isLoadingResults, setIsLoadingResults] = React.useState(false);

  // Auto-load results if completed and results are not present
  React.useEffect(() => {
    if (
      step.status === StepStatus.COMPLETED &&
      !results &&
      onLoadResults
    ) {
      setIsLoadingResults(true);
      // Call the provided callback to fetch results
      onLoadResults();
    }
    // If results arrive, stop loading
    if (results) setIsLoadingResults(false);
  }, [step.status, results, onLoadResults]);

  const getStatusIcon = () => {
    switch (step.status) {
      case StepStatus.COMPLETED:
        return <CheckCircle2 className="text-green-500" size={24} />;
      case StepStatus.IN_PROGRESS:
        return <Clock className="text-blue-500" size={24} />;
      case StepStatus.FAILED:
        return <XCircle className="text-red-500" size={24} />;
      case StepStatus.REQUIRES_ACTION:
        return <AlertCircle className="text-yellow-500" size={24} />;
      default:
        return <Clock className="text-slate-400" size={24} />;
    }
  };

  const getStatusColor = () => {
    switch (step.status) {
      case StepStatus.COMPLETED:
        return 'text-green-400';
      case StepStatus.IN_PROGRESS:
        return 'text-blue-400';
      case StepStatus.FAILED:
        return 'text-red-400';
      case StepStatus.REQUIRES_ACTION:
        return 'text-yellow-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={isDark ? "bg-slate-800/50" : "bg-white shadow-sm"}>
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <p className={`font-medium ${getStatusColor()}`}>
                {step.status.charAt(0).toUpperCase() + step.status.slice(1).replace('-', ' ')}
              </p>
              <p className={isDark ? "text-slate-400" : "text-slate-500"}>Current Status</p>
            </div>
          </div>
        </Card>
        <Card className={isDark ? "bg-slate-800/50" : "bg-white shadow-sm"}>
          <div className="flex items-center space-x-3">
            <Activity className={isDark ? "text-blue-400" : "text-indigo-600"} size={24} />
            <div>
              <p className={isDark ? "text-slate-100" : "text-slate-900"} style={{ fontWeight: 500 }}>
                {step.status === StepStatus.COMPLETED ? '5 sec' : `${step.estimatedTime} seconds`}
              </p>
              <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                {step.status === StepStatus.COMPLETED ? 'Completed in' : 'Estimated time'}
              </p>
            </div>
          </div>
        </Card>
        <Card className={isDark ? "bg-slate-800/50" : "bg-white shadow-sm"}>
          <div className="flex items-center space-x-3">
            <BarChart3 className={isDark ? "text-green-400" : "text-green-600"} size={24} />
            <div>
              <p className={isDark ? "text-slate-100" : "text-slate-900"} style={{ fontWeight: 500 }}>
                {step.automationType.charAt(0).toUpperCase() + step.automationType.slice(1).replace('-', ' ')}
              </p>
              <p className={isDark ? "text-slate-400" : "text-slate-500"}>Automation Type</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Results Section */}
      {step.status === StepStatus.COMPLETED && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-xl p-6 ${
            isDark 
              ? "bg-slate-800/50 border-slate-700/50" 
              : "bg-white border-indigo-200/50 shadow-sm"
          }`}
        >
          <h3 className={`text-xl font-semibold mb-4 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            Execution Results
          </h3>
          {isLoadingResults ? (
            <div className="flex flex-col items-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                className="mb-4"
              >
                <Clock className={isDark ? "text-blue-400" : "text-indigo-600"} size={40} />
              </motion.div>
              <p className={isDark ? "text-slate-100" : "text-slate-900"}>Loading results...</p>
            </div>
          ) : results ? (
            <div className="space-y-4">
              {renderDynamicResults(results, isDark)}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className={isDark ? "text-slate-400" : "text-slate-500"}>No results available</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Pending/In Progress State */}
      {(step.status === StepStatus.PENDING || step.status === StepStatus.IN_PROGRESS) && (
        <div className={`border rounded-xl p-6 ${
          isDark 
            ? "bg-slate-800/50 border-slate-700/50" 
            : "bg-white border-indigo-200/50 shadow-sm"
        }`}>
          <div className="text-center py-8">
            <div className="mb-4 flex justify-center">
              {step.status === StepStatus.IN_PROGRESS ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="inline-block"
                >
                  <Clock className={isDark ? "text-blue-400" : "text-indigo-600"} size={48} />
                </motion.div>
              ) : (
                <Clock className={isDark ? "text-slate-400" : "text-slate-500"} size={48} />
              )}
            </div>
            <p className={isDark ? "text-slate-100" : "text-slate-900"} style={{ fontSize: '1.125rem' }}>
              {step.status === StepStatus.IN_PROGRESS 
                ? 'Step is currently executing...' 
                : 'Step is ready to execute'
              }
            </p>
            <p className={isDark ? "text-slate-400" : "text-slate-500"} style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Results will be displayed here after completion
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepDashboard;