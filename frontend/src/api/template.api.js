import apiClient from './axios';

export const getTemplates = async () => {
  const response = await apiClient.get('/templates');
  return response.data.data;
};

export const getTemplate = async (id) => {
  const response = await apiClient.get(`/templates/${id}`);
  return response.data.data;
};

export const createTemplate = async (templateData) => {
  const response = await apiClient.post('/templates', templateData);
  return response.data.data;
};

export const updateTemplate = async (id, templateData) => {
  const response = await apiClient.put(`/templates/${id}`, templateData);
  return response.data.data;
};

export const deleteTemplate = async (id) => {
  const response = await apiClient.delete(`/templates/${id}`);
  return response.data;
};

export const duplicateTemplate = async (id) => {
  const response = await apiClient.post(`/templates/${id}/duplicate`);
  return response.data.data;
};

export const previewTemplate = async (id, sampleLead = {}) => {
  const response = await apiClient.post(`/templates/${id}/preview`, sampleLead);
  return response.data.data;
};
