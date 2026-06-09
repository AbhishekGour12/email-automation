import apiClient from './axios';

export const getCampaigns = async () => {
  const response = await apiClient.get('/campaigns');
  return response.data.data;
};

export const getCampaign = async (id) => {
  const response = await apiClient.get(`/campaigns/${id}`);
  return response.data.data;
};

export const createCampaign = async (campaignData) => {
  const response = await apiClient.post('/campaigns', campaignData);
  return response.data.data;
};

export const updateCampaign = async (id, campaignData) => {
  const response = await apiClient.put(`/campaigns/${id}`, campaignData);
  return response.data.data;
};

export const deleteCampaign = async (id) => {
  const response = await apiClient.delete(`/campaigns/${id}`);
  return response.data;
};

export const startCampaign = async (id) => {
  const response = await apiClient.post(`/campaigns/${id}/start`);
  return response.data.data;
};

export const pauseCampaign = async (id) => {
  const response = await apiClient.post(`/campaigns/${id}/pause`);
  return response.data;
};

export const resumeCampaign = async (id) => {
  const response = await apiClient.post(`/campaigns/${id}/resume`);
  return response.data;
};

export const cancelCampaign = async (id) => {
  const response = await apiClient.post(`/campaigns/${id}/cancel`);
  return response.data;
};

export const getCampaignFollowups = async (id) => {
  const response = await apiClient.get(`/campaigns/${id}/followups`);
  return response.data.data;
};
