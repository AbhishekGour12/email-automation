import apiClient from './axios';

export const getLeads = async (params) => {
  const response = await apiClient.get('/leads', { params });
  return response.data.data;
};

export const getLeadDetails = async (id) => {
  const response = await apiClient.get(`/leads/${id}`);
  return response.data.data;
};

export const createLead = async (leadData) => {
  const response = await apiClient.post('/leads', leadData);
  return response.data.data;
};

export const updateLead = async (id, leadData) => {
  const response = await apiClient.put(`/leads/${id}`, leadData);
  return response.data.data;
};

export const deleteLead = async (id) => {
  const response = await apiClient.delete(`/leads/${id}`);
  return response.data;
};

export const importLeadsFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/leads/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};
