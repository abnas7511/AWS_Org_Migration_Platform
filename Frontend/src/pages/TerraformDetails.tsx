import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, FileCode } from 'lucide-react';
import { PhaseType } from '../types/migration';
import { useTheme } from '../context/ThemeContext';
import { useMigration } from '../context/MigrationContext';

const TerraformDetails: React.FC = () => {
  const { theme } = useTheme();
  const { migrationProcess } = useMigration();
  const [expandedPhase, setExpandedPhase] = useState<PhaseType | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          Terraform Documentation
        </h1>
        
        <div className="space-y-4">
          {migrationProcess.phases.map((phase) => {
            // Filter steps that have API available (can be automated with Terraform)
            const terraformSteps = phase.steps.filter(step => step.apiAvailable);
            
            if (terraformSteps.length === 0) return null;
            
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
                      ({terraformSteps.length} Configurations)
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
                      {terraformSteps.map((step) => (
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
                              <FileCode size={18} className={theme === 'dark' ? 'text-green-400' : 'text-green-600'} />
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
                                    Main Configuration
                                  </h3>
                                  <pre className={`rounded-lg p-3 overflow-x-auto ${
                                    theme === 'dark' ? 'bg-slate-800' : 'bg-indigo-50'
                                  }`}>
                                    <code className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>
{`resource "aws_${step.title.toLowerCase().replace(/\s+/g, '_')}" "this" {
  # Configuration would go here based on step requirements
  ${step.automationType === 'FULLY_AUTOMATED' ? 'automated = true' : '# Requires some manual configuration'}
}`}
                                    </code>
                                  </pre>
                                </div>

                                <div>
                                  <h3 className={`text-sm font-medium mb-2 ${
                                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                                  }`}>
                                    Variables
                                  </h3>
                                  <pre className={`rounded-lg p-3 overflow-x-auto ${
                                    theme === 'dark' ? 'bg-slate-800' : 'bg-indigo-50'
                                  }`}>
                                    <code className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}>
{`variable "${step.title.toLowerCase().replace(/\s+/g, '_')}_config" {
  description = "Configuration for ${step.title}"
  type        = map(string)
  default     = {}
}`}
                                    </code>
                                  </pre>
                                </div>

                                <div>
                                  <h3 className={`text-sm font-medium mb-2 ${
                                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                                  }`}>
                                    Outputs
                                  </h3>
                                  <pre className={`rounded-lg p-3 overflow-x-auto ${
                                    theme === 'dark' ? 'bg-slate-800' : 'bg-indigo-50'
                                  }`}>
                                    <code className={theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}>
{`output "${step.title.toLowerCase().replace(/\s+/g, '_')}_id" {
  description = "ID of the ${step.title}"
  value       = aws_${step.title.toLowerCase().replace(/\s+/g, '_')}.this.id
}`}
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

export default TerraformDetails;