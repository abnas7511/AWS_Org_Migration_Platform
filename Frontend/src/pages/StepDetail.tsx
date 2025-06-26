import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useMigration } from '../context/MigrationContext';
import { useTheme } from '../context/ThemeContext';
import { useAccount } from '../context/AccountContext';
import { StepStatus, AutomationType } from '../types/migration';
import Button from '../components/ui/Button';
import { ArrowLeft, Check, Clock, AlertTriangle, Bot, Terminal, FileText, ExternalLink, BarChart3 } from 'lucide-react';
import { migrationApi } from '../services/migrationApi';
import Tabs, { TabPanel } from '../components/ui/Tabs';
import StepDashboard from '../components/migration/StepDashboard';
import StepLogs from '../components/migration/StepLogs';
import AccountSelector from '../components/AccountSelector';
import StepRequiredGuard from '../components/guards/StepRequiredGuard';
import ManualStepInstructions from '../components/migration/ManualStepInstructions';

interface StepDetailProps {}

const StepDetail: React.FC<StepDetailProps> = () => {
  const { phaseType, stepSlug } = useParams<{ phaseType: string, stepSlug: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { selectedAccount } = useAccount();
  const { 
    migrationProcess, 
    startStep, 
    completeStep, 
    requireAction,
    setStepFailed,
    isLoading 
  } = useMigration();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [apiResult, setApiResult] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Find the phase and step based on URL parameters
  const phase = migrationProcess.phases.find(p => p.type === phaseType);
  // First try to find step by slug, then fallback to numeric ID
  const step = phase?.steps.find(s => s.slug === stepSlug) || 
               phase?.steps.find(s => s.id === Number(stepSlug));
  
  if (!phase || !step) {
    return <div className={`p-6 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Step not found</div>;
  }
  
  // Function to fetch previous execution results
  const fetchPreviousResults = async () => {
    if (step && step.status === StepStatus.COMPLETED) {
      try {
        const result = await migrationApi.executeStep(step.id, selectedAccount?.accountId);
        setApiResult(result);
        setLogs(result.logs || []);
        setShowResults(true);
      } catch (error) {
        console.error('Error fetching previous results:', error);
      }
    }
  };
  
  // Check if step is completed and set appropriate state
  useEffect(() => {
    if (step && step.status === StepStatus.COMPLETED) {
      setApiResult({ dummy: true }); // Just to trigger the "Agent execution results" text
    }
  }, [step?.status]);
  
  // Function to call the API
  const executeStepApi = async () => {
    if (!step) return;
    
    setIsProcessing(true);
    setApiError(null);
    setShowResults(true); // Show results during execution
    setLogs(["Initializing AWS SDK...", "Connecting to AWS account..."]);
    
    try {
      const result = await migrationApi.executeStep(step.id, selectedAccount?.accountId);
      setApiResult(result);
      setLogs(result.logs || []);
      
      // Automatically complete the step if successful and automated
      if (
        result.status === StepStatus.COMPLETED &&
        step.automationType === AutomationType.FULLY_AUTOMATED
      ) {
        completeStep(step.id);
        setTimeout(() => {
          setIsProcessing(false);
        }, 1000);
      } else if (result.status === StepStatus.FAILED) {
        setStepFailed(step.id);
        setIsProcessing(false);
      } else {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error executing step:', error);
      setApiError(`Failed to execute step: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
    }
  };
  
  useEffect(() => {
    // If step is in progress and automated, call the API
    if (step && 
        step.status === StepStatus.IN_PROGRESS && 
        step.automationType === AutomationType.FULLY_AUTOMATED && 
        !isProcessing && 
        !apiResult) {
      executeStepApi();
    }
  }, [step?.status, step?.automationType, step?.id]);
  
  const handleStartStep = () => {
    if (!step) return;
    startStep(step.id);
    executeStepApi();
  };
  
  const handleCompleteStep = () => {
    if (!step) return;
    completeStep(step.id);
    navigate(`/phase/${phaseType}`);
  };
  
  const getStatusBadge = () => {
    switch (step.status) {
      case StepStatus.COMPLETED:
        return (
          <span className="flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-500 border border-green-500/30">
            <Check size={14} className="mr-1" /> Completed
          </span>
        );
      case StepStatus.IN_PROGRESS:
        return (
          <span className={`flex items-center px-3 py-1 rounded-full border ${
            theme === 'dark'
              ? 'bg-blue-500/20 text-blue-500 border-blue-500/30'
              : 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30'
          }`}>
            <motion.div 
              className={`w-3 h-3 rounded-full mr-2 ${
                theme === 'dark' ? 'bg-blue-500' : 'bg-indigo-500'
              }`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            In Progress
          </span>
        );
      case StepStatus.REQUIRES_ACTION:
        return (
          <span className="flex items-center px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
            <AlertTriangle size={14} className="mr-1" /> Action Required
          </span>
        );
      case StepStatus.FAILED:
        return (
          <span className="flex items-center px-3 py-1 rounded-full bg-red-500/20 text-red-500 border border-red-500/30">
            <AlertTriangle size={14} className="mr-1" /> Failed
          </span>
        );
      default:
        return (
          <span className={`flex items-center px-3 py-1 rounded-full border ${
            theme === 'dark'
              ? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
              : 'bg-slate-300/30 text-slate-600 border-slate-300/50'
          }`}>
            <Clock size={14} className="mr-1" /> Pending
          </span>
        );
    }
  };

  // Tabs state for dashboard/logs
  const [activeTabId, setActiveTabId] = useState<string>("dashboard");

  return (
    <StepRequiredGuard stepId={step.id} phaseType={phaseType || ''}>
      <div className="p-6">
        <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`backdrop-blur-sm border rounded-xl p-6 mb-6 ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50'
            : 'bg-white border-indigo-200/50 shadow-md'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div className="flex items-start">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/phase/${phaseType}`)}
              icon={<ArrowLeft size={18} />}
              className="mr-3"
            />
            <div>
              <div className="flex items-center">
                <h1 className={`text-2xl font-bold mr-3 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  {step.title}
                </h1>
                {getStatusBadge()}
              </div>
              <p className={theme === 'dark' ? 'text-slate-300 mt-1' : 'text-slate-600 mt-1'}>
                {step.description}
              </p>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <AccountSelector />
          </div>
        </div>
      </motion.div>
      
      <div className="w-full">
        {/* For manual steps, show instructions instead of tabs */}
        {step.automationType === AutomationType.MANUAL? (
          <ManualStepInstructions 
            step={step} 
            onComplete={handleCompleteStep}
            isCompleting={isLoading}
            completed={step.status === StepStatus.COMPLETED}
          />
        ) : (
          <div className={`backdrop-blur-sm border rounded-xl p-6 mb-6 ${
            theme === 'dark'
              ? 'bg-slate-900/80 border-slate-700/50'
              : 'bg-white border-indigo-200/50 shadow-md'
          }`}>
            <Tabs
              tabs={[
                { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
                { id: 'logs', label: 'Logs', icon: <Terminal size={16} /> }
              ]}
              defaultTab="dashboard"
              onTabChange={setActiveTabId}
              actionButtons={
                <>
                  {step.status === StepStatus.PENDING && (
                    <Button
                      variant="primary"
                      onClick={handleStartStep}
                      isLoading={isLoading || isProcessing}
                    >
                      Start Step
                    </Button>
                  )}

                  {/* Only show Complete Step for manual steps */}
                  {step.status === StepStatus.IN_PROGRESS &&
                    step.automationType === AutomationType.MANUAL && (
                      <Button
                        variant="primary"
                        onClick={handleCompleteStep}
                        isLoading={isLoading}
                      >
                        Complete Step
                      </Button>
                    )}
                </>
              }
            >
              {/* Dashboard Tab */}
              <TabPanel tabId="dashboard" activeTab={activeTabId}>
                {/* Show message when apiResult is present and step is not completed */}
                {apiResult && step.status !== StepStatus.COMPLETED && (
                  <div className="mb-4 p-3 rounded bg-green-100 text-green-800 border border-green-300">
                      Step execution completed.
                  </div>
                )}
                <StepDashboard 
                  step={step} 
                  results={apiResult?.result} 
                  onLoadResults={step.status === StepStatus.COMPLETED ? fetchPreviousResults : undefined}
                />
              </TabPanel>
              
              {/* Logs Tab */}
              <TabPanel tabId="logs" activeTab={activeTabId}>
                <StepLogs 
                  stepId={step.id} 
                  isExecuting={isProcessing} 
                  logs={logs}
                />
              </TabPanel>
            </Tabs>
          </div>
        )}
      </div>
    </div>
    </StepRequiredGuard>
  );
};

export default StepDetail;