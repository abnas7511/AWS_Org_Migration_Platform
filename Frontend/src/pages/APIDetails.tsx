import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Code } from 'lucide-react';
import { PhaseType } from '../types/migration';
import { useTheme } from '../context/ThemeContext';
import { useMigration } from '../context/MigrationContext';

const APIDetails: React.FC = () => {
  const { theme } = useTheme();
  const { migrationProcess } = useMigration();
  const [expandedPhase, setExpandedPhase] = useState<PhaseType | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          API Documentation
        </h1>
        
        <div className="space-y-4">
          {migrationProcess.phases.map((phase) => {
            // Filter steps that have API available
            const apiSteps = phase.steps.filter(step => step.apiAvailable);
            
            if (apiSteps.length === 0) return null;
            
            return (
              <motion.div
                key={phase.type}
                className={`border rounded-lg overflow-hidden ${
                  theme === 'dark' 
                    ? 'border-slate-700/50' 
                    : 'border-indigo-200/50'
                }`}
                initial={false}
              >
                <button
                  className={`w-full p-4 flex items-center justify-between ${
                    theme === 'dark'
                      ? 'bg-slate-800/50 hover:bg-slate-800/80'
                      : 'bg-indigo-50/50 hover:bg-indigo-50/80'
                  }`}
                  onClick={() => setExpandedPhase(expandedPhase === phase.type ? null : phase.type)}
                >
                  <div className="flex items-center">
                    {expandedPhase === phase.type ? (
                      <ChevronDown size={20} className={theme === 'dark' ? 'text-white' : 'text-indigo-700'} />
                    ) : (
                      <ChevronRight size={20} className={theme === 'dark' ? 'text-white' : 'text-indigo-700'} />
                    )}
                    <span className={`ml-2 font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {phase.title}
                    </span>
                    <span className={`ml-2 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      ({apiSteps.length} APIs)
                    </span>
                  </div>
                </button>

                {expandedPhase === phase.type && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-indigo-200/50'}`}
                  >
                    <div className="p-4 space-y-4">
                      {apiSteps.map((step) => (
                        <div 
                          key={step.id} 
                          className={`border rounded-lg ${
                            theme === 'dark' ? 'border-slate-700/50' : 'border-indigo-200/50'
                          }`}
                        >
                          <button
                            className={`w-full p-4 flex items-center justify-between rounded-lg ${
                              theme === 'dark'
                                ? 'hover:bg-slate-800/50'
                                : 'hover:bg-indigo-50/50'
                            }`}
                            onClick={() => setExpandedStep(expandedStep === `${phase.type}-${step.id}` ? null : `${phase.type}-${step.id}`)}
                          >
                            <div className="flex items-center">
                              <Code size={18} className={theme === 'dark' ? 'text-blue-400' : 'text-indigo-600'} />
                              <span className={`ml-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                                {step.title}
                              </span>
                            </div>
                            {expandedStep === `${phase.type}-${step.id}` ? (
                              <ChevronDown size={18} className={theme === 'dark' ? 'text-white' : 'text-indigo-700'} />
                            ) : (
                              <ChevronRight size={18} className={theme === 'dark' ? 'text-white' : 'text-indigo-700'} />
                            )}
                          </button>

                          {expandedStep === `${phase.type}-${step.id}` && (
                            <div className={`p-4 border-t ${
                              theme === 'dark' ? 'border-slate-700/50' : 'border-indigo-200/50'
                            }`}>
                              <p className={`mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                                {step.description}
                              </p>
                              
                              <div className="space-y-4">
                                <div>
                                  <h3 className={`text-sm font-medium mb-2 ${
                                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                                  }`}>
                                    API Endpoint
                                  </h3>
                                  <div className={`rounded-lg p-3 ${
                                    theme === 'dark' ? 'bg-slate-800' : 'bg-indigo-50'
                                  }`}>
                                    <code className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}>
                                      {`aws:${step.title.toLowerCase().replace(/\s+/g, '-')}`}
                                    </code>
                                  </div>
                                </div>

                                <div>
                                  <h3 className={`text-sm font-medium mb-2 ${
                                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                                  }`}>
                                    Method
                                  </h3>
                                  <div className={`rounded-lg p-3 ${
                                    theme === 'dark' ? 'bg-slate-800' : 'bg-indigo-50'
                                  }`}>
                                    <code className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>
                                      {step.automationType === 'FULLY_AUTOMATED' ? 'POST' : 'GET'}
                                    </code>
                                  </div>
                                </div>

                                <div>
                                  <h3 className={`text-sm font-medium mb-2 ${
                                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                                  }`}>
                                    Python Example
                                  </h3>
                                  <pre className={`rounded-lg p-3 overflow-x-auto ${
                                    theme === 'dark' ? 'bg-slate-800' : 'bg-indigo-50'
                                  }`}>
                                    <code className={theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}>
{`import boto3

client = boto3.client('${step.title.toLowerCase().split(' ')[0]}')

response = client.${step.title.toLowerCase().replace(/\s+/g, '_')}(
    # Parameters would go here
)

print(response)`}
                                    </code>
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default APIDetails;