import apiClient from './axios';

export const loginUser = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data.data;
};

export const registerUser = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data.data;
};

export const forgotPasswordLink = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPasswordConfirm = async (password) => {
  const response = await apiClient.post('/auth/reset-password', { password });
  return response.data;
};
