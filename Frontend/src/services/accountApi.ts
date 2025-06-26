// Frontend/src/services/accountApi.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8005/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface AwsAccount {
  id?: number;
  account_name: string;
  account_id: string;
  region: string;
  accesskey: string;
  secretkey: string;
  session_token?: string;
  created_by?: string;
  created_at?: string;
  updated_by: string;
  updated_at?: string;
}

export const accountApi = {
  // Create or update AWS account
  saveAccount: async (account: AwsAccount) => {
    const response = await api.post('/account-management', account);
    return response.data;
  },

  // Get all accounts
  getAccounts: async () => {
    const response = await api.get('/account-management');
    return response.data;
  },

  // Get account by ID
  getAccount: async (accountId: string) => {
    const response = await api.get(`/account-management/${accountId}`);
    return response.data;
  },

  // Delete account
  deleteAccount: async (accountId: string) => {
    const response = await api.delete(`/account-management/${accountId}`);
    return response.data;
  },

  // Test AWS credentials
  testConnection: async (account: AwsAccount) => {
    const response = await api.post('/account-management/test-connection', account);
    return response.data;
  }
};