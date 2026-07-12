import api from './index';

export const getMaintenanceLogs = async (filters = {}) => {
  const { data } = await api.get('/maintenance', { params: filters });
  return data;
};

export const createMaintenanceLog = async (logData) => {
  const { data } = await api.post('/maintenance', logData);
  return data;
};

export const closeMaintenanceLog = async (id, closeData) => {
  const { data } = await api.put(`/maintenance/${id}/close`, closeData);
  return data;
};
