import api from './index';

export const getFuelLogs = async (filters = {}) => {
  const { data } = await api.get('/fuel-logs', { params: filters });
  return data;
};

export const createFuelLog = async (logData) => {
  const { data } = await api.post('/fuel-logs', logData);
  return data;
};
