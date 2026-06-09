import apiClient from './axios';

export const getReplies = async () => {
  const response = await apiClient.get('/replies');
  return response.data.data;
};

export const tagReply = async (id, tag) => {
  const response = await apiClient.put(`/replies/${id}/tag`, { tag });
  return response.data.data;
};
