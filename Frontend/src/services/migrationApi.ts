// Frontend/src/services/migrationApi.ts
import axios from 'axios';
import { getStepById } from '../data/migrationSteps';
import { useAccount } from '../context/AccountContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8005/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const migrationApi = {
 executeStep: async (stepId: string | number, accountId?: string) => {
  const step = getStepById(Number(stepId));
  if (!step?.slug) {
    throw new Error(`Step with ID ${stepId} not found`);
  }
  // Ensure slug is defined 
  const slug = step.slug;
  // Dynamically get phase type from the step
  const phaseType = step.phase.toLowerCase().replace(/\s+/g, '-');
  const path = `${phaseType}/${slug}`;
  
  // Add account_id as query parameter if provided
  const params = accountId ? { account_id: accountId } : {};
  
  console.log("Calling API URL:", `${API_BASE_URL}/${path}`, "with account:", accountId);
  const response = await api.get(path, { params });
  return response.data;
  },


  getStepHistory: async (stepId: string | number, accountId?: string) => {
    const step = getStepById(Number(stepId));
    if (!step?.slug) {
      throw new Error(`Step with ID ${stepId} not found`);
    }
    
    const phaseType = step.phase.toLowerCase().replace(/\s+/g, '-');
    const params = accountId ? { account_id: accountId } : {};
    const response = await api.get(`${phaseType}/${step.slug}/history`, { params });
    return response.data;
  },

  fetchLatestStepResult: async (stepId: string | number, accountId?: string) => {
    const step = getStepById(Number(stepId));
    if (!step?.slug) {
      throw new Error(`Step with ID ${stepId} not found`);
    }
    
    const phaseType = step.phase.toLowerCase().replace(/\s+/g, '-');
    const params = accountId ? { account_id: accountId } : {};
    const response = await api.get(`${phaseType}/${step.slug}/latest`, { params });
    return response.data;
  }
};
