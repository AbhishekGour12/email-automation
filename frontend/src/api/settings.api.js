import apiClient from './axios';

export const getSettings = async () => {
  const response = await apiClient.get('/settings');
  return response.data.data;
};

export const updateSettingsSection = async (section, settingsData) => {
  const response = await apiClient.put(`/settings/${section}`, settingsData);
  return response.data.data;
};

export const testSmtpConnection = async (smtpData = null) => {
  const response = await apiClient.post('/settings/test-smtp', smtpData || {});
  return response.data;
};
