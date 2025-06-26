import React, { useState } from 'react';
import AgentInterface from '../agent/AgentInterface';

const FloatingChatButton: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <AgentInterface 
      isExpanded={isExpanded} 
      onToggleExpand={toggleExpand} 
    />
  );
};

export default FloatingChatButton;