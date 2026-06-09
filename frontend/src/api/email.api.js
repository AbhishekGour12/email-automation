import apiClient from './axios';

export const getEmailHistory = async () => {
  const response = await apiClient.get('/email/history');
  return response.data.data;
};
