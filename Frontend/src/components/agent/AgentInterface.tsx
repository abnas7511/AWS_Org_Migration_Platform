import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, MessageCircle } from 'lucide-react';
import { useMigration } from '../../context/MigrationContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';
import { AgentMessage } from '../../types/migration';

interface AgentInterfaceProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const AgentInterface: React.FC<AgentInterfaceProps> = ({ 
  isExpanded = false,
  onToggleExpand
}) => {
  const { messages, addMessage, startStep, completeStep, currentStep } = useMigration();
  const { theme } = useTheme();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show tooltip after a delay when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isExpanded) {
        setShowTooltip(true);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isExpanded]);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    // Add user message
    addMessage({
      content: input,
      type: 'user'
    });
    
    setInput('');
    
    // Simulate agent typing
    setIsTyping(true);
    
    // Simulate agent response after a delay
    setTimeout(() => {
      const response = getAgentResponse(input);
      
      addMessage({
        content: response.content,
        type: 'agent',
        status: 'complete',
        relatedStepId: response.relatedStepId
      });
      
      setIsTyping(false);
      
      // If there's a step action, perform it
      if (response.action && currentStep) {
        if (response.action === 'start') {
          startStep(currentStep.id);
        } else if (response.action === 'complete') {
          completeStep(currentStep.id);
        }
      }
    }, 1500);
  };

  const getAgentResponse = (userInput: string): { 
    content: string; 
    relatedStepId?: number;
    action?: 'start' | 'complete' | 'fail';
  } => {
    const normalizedInput = userInput.toLowerCase();
    
    if (normalizedInput.includes('start') || normalizedInput.includes('begin') || normalizedInput.includes('proceed')) {
      return {
        content: "I'll start the current step for you. This will initiate the automated process to check for resources shared via RAM with the rest of the organization or OUs.",
        relatedStepId: currentStep?.id,
        action: 'start'
      };
    }
    
    if (normalizedInput.includes('complete') || normalizedInput.includes('done') || normalizedInput.includes('finished')) {
      return {
        content: "Great! I've marked this step as complete. Let's move on to the next step in the migration process.",
        relatedStepId: currentStep?.id,
        action: 'complete'
      };
    }
    
    if (normalizedInput.includes('help')) {
      return {
        content: "I'm here to help you with the AWS account migration process. You can ask me to start a step, mark it as complete, or provide more information about any step in the migration. What would you like to know?"
      };
    }
    
    if (normalizedInput.includes('explain') || normalizedInput.includes('what') || normalizedInput.includes('how')) {
      return {
        content: `The current step "${currentStep?.title}" is part of the ${currentStep?.phase} phase. ${currentStep?.description}. ${currentStep?.apiAvailable ? 'This step can be automated using AWS APIs.' : 'This step requires manual intervention.'}`
      };
    }
    
    // Default response
    return {
      content: "I understand you're working on the migration process. What specific action would you like to take with the current step? You can ask me to start it, complete it, or explain it in more detail."
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleAgentClick = () => {
    setShowTooltip(false);
    if (onToggleExpand) {
      onToggleExpand();
    }
  };

  const MessageItem: React.FC<{ message: AgentMessage }> = ({ message }) => {
    return (
      <motion.div
        className={`flex mb-4 ${message.type === 'agent' ? 'justify-start' : 'justify-end'}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {message.type === 'agent' && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0 ${
            theme === 'dark' ? 'bg-blue-600' : 'bg-indigo-600'
          }`}>
            <Bot size={16} className="text-white" />
          </div>
        )}
        
        <div
          className={`max-w-[75%] px-4 py-3 rounded-xl ${
            message.type === 'agent'
              ? theme === 'dark' 
                ? 'bg-slate-800 text-white rounded-tl-none'
                : 'bg-indigo-100 text-slate-800 rounded-tl-none'
              : 'bg-indigo-600 text-white rounded-tr-none'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        
        {message.type === 'user' && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-2 flex-shrink-0 ${
            theme === 'dark' ? 'bg-slate-700' : 'bg-indigo-200'
          }`}>
            <User size={16} className={theme === 'dark' ? 'text-white' : 'text-indigo-700'} />
          </div>
        )}
      </motion.div>
    );
  };

  // If not expanded, show just the circular icon with tooltip
  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <motion.div
          className="relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {showTooltip && (
            <motion.div 
              className={`absolute bottom-16 right-0 p-3 rounded-xl shadow-lg w-64 ${
                theme === 'dark' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-white text-slate-800 border border-indigo-200'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start">
                <Bot size={18} className={`mr-2 mt-0.5 flex-shrink-0 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-indigo-600'
                }`} />
                <p className="text-sm">Hi, Need help with your migration?</p>
              </div>
              <div className={`absolute bottom-[-8px] right-6 w-4 h-4 transform rotate-45 ${
                theme === 'dark' ? 'bg-slate-800' : 'bg-white border-r border-b border-indigo-200'
              }`}></div>
            </motion.div>
          )}
          
          <motion.button
            className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg border-2 border-indigo-400/20"
            onClick={handleAgentClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MessageCircle size={24} className="text-white" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Full chat interface when expanded
  return (
    <motion.div
      className={`fixed bottom-6 right-6 backdrop-blur-lg rounded-xl border shadow-2xl overflow-hidden z-40 w-80 sm:w-96 ${
        theme === 'dark'
          ? 'bg-slate-900/95 border-slate-700/50'
          : 'bg-white/95 border-indigo-200/50'
      }`}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 p-3 flex items-center justify-between cursor-pointer border-b border-indigo-700/50"
        onClick={handleAgentClick}
      >
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center mr-2">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium">AI Chat Bot</h3>
            {isTyping && (
              <p className="text-indigo-200 text-xs">Typing...</p>
            )}
          </div>
        </div>
      </div>
      
      <div className={`h-96 overflow-y-auto p-4 ${
        theme === 'dark' ? 'bg-slate-900/80' : 'bg-slate-50/80'
      }`}>
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
              theme === 'dark' ? 'bg-blue-600' : 'bg-indigo-600'
            }`}>
              <Bot size={16} className="text-white" />
            </div>
            <div className={`px-4 py-3 rounded-xl rounded-tl-none ${
              theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-indigo-100 text-slate-800'
            }`}>
              <div className="flex space-x-2">
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  theme === 'dark' ? 'bg-slate-500' : 'bg-indigo-400'
                }`} style={{ animationDelay: '0ms' }} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  theme === 'dark' ? 'bg-slate-500' : 'bg-indigo-400'
                }`} style={{ animationDelay: '150ms' }} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  theme === 'dark' ? 'bg-slate-500' : 'bg-indigo-400'
                }`} style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className={`p-3 border-t ${
        theme === 'dark' 
          ? 'bg-slate-800/80 border-slate-700/50' 
          : 'bg-slate-100/80 border-indigo-200/50'
      }`}>
        <div className="flex items-center">
          <input
            type="text"
            className={`flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              theme === 'dark'
                ? 'bg-slate-700/50 border border-slate-600/50 text-white'
                : 'bg-white border border-indigo-300/50 text-slate-800'
            }`}
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            variant="primary"
            size="sm"
            className="ml-2"
            onClick={handleSendMessage}
            disabled={!input.trim()}
            icon={<Send size={16} />}
          >
            Send
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default AgentInterface;