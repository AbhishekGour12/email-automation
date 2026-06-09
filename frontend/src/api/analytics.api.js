import apiClient from './axios';

export const getGlobalAnalytics = async () => {
  const response = await apiClient.get('/analytics/global');
  return response.data.data;
};

export const getCampaignAnalytics = async (campaignId) => {
  const response = await apiClient.get(`/analytics/campaign/${campaignId}`);
  return response.data.data;
};

export const getTimebasedAnalytics = async (range = 'daily') => {
  const response = await apiClient.get('/analytics/timebased', { params: { range } });
  return response.data.data;
};
