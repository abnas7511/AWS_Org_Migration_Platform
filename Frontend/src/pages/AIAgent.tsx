import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';
import Button from '../components/ui/Button';
import { useMigration } from '../context/MigrationContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const AIAgent: React.FC = () => {
  const { messages, addMessage, startMigration } = useMigration();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (showDashboard) {
      navigate('/dashboard');
    }
  }, [showDashboard, navigate]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    addMessage({
      content: input,
      type: 'user'
    });

    setInput('');

    // Simulate agent response
    setTimeout(() => {
      const response = getAgentResponse(input);
      addMessage({
        content: response.content,
        type: 'agent',
        status: 'complete'
      });

      if (response.action === 'start-migration') {
        startMigration();
        setShowDashboard(true);
      }
    }, 1000);
  };

  const getAgentResponse = (userInput: string) => {
    const normalizedInput = userInput.toLowerCase();
    
    if (normalizedInput.includes('start') || normalizedInput.includes('begin')) {
      return {
        content: "I'll help you start the migration process. Would you like to monitor the progress through the dashboard?",
        action: 'start-migration'
      };
    }

    if (normalizedInput.includes('help')) {
      return {
        content: "I'm here to guide you through the AWS account migration process. I can help you with:\n\n1. Starting the migration\n2. Explaining each step\n3. Providing best practices\n4. Troubleshooting issues\n\nWhat would you like to know more about?"
      };
    }

    return {
      content: "I understand you're working on AWS account migration. How can I assist you today? You can ask me to:\n\n- Start the migration process\n- Explain specific steps\n- Provide guidance on best practices"
    };
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-grow p-6 overflow-hidden">
        <div className={`h-full backdrop-blur-xl border rounded-xl overflow-hidden ${
          theme === 'dark'
            ? 'bg-slate-900/80 border-slate-700/50'
            : 'bg-white/90 border-indigo-200/50'
        }`}>
          <div className={`p-6 border-b ${
            theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200/50'
          }`}>
            <div className="flex items-center">
              <Bot size={24} className={theme === 'dark' ? 'text-blue-400 mr-3' : 'text-indigo-600 mr-3'} />
              <div>
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  AWS Migration AI Agent
                </h1>
                <p className={theme === 'dark' ? 'text-slate-400 text-sm' : 'text-slate-500 text-sm'}>
                  Your intelligent migration assistant
                </p>
              </div>
            </div>
          </div>

          <div className="h-[calc(100vh-240px)] overflow-y-auto p-6">
            <div className="space-y-6">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.type === 'agent' ? 'justify-start' : 'justify-end'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {message.type === 'agent' && (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-3">
                      <Bot size={16} className="text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[70%] p-4 rounded-xl ${
                      message.type === 'agent'
                        ? theme === 'dark'
                          ? 'bg-slate-800 text-white'
                          : 'bg-indigo-100 text-slate-800'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {message.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center ml-3">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className={`p-6 border-t ${
            theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200/50'
          }`}>
            <div className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className={`flex-1 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  theme === 'dark'
                    ? 'bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border border-slate-300 text-slate-800 placeholder-slate-400'
                }`}
              />
              <Button
                variant="primary"
                onClick={handleSendMessage}
                disabled={!input.trim()}
                icon={<Send size={18} />}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgent;