import api from './index';

export const getDrivers = async (filters = {}) => {
  const { data } = await api.get('/drivers', { params: filters });
  return data;
};

export const createDriver = async (driverData) => {
  const { data } = await api.post('/drivers', driverData);
  return data;
};

export const updateDriver = async (id, driverData) => {
  const { data } = await api.put(`/drivers/${id}`, driverData);
  return data;
};

export const deleteDriver = async (id) => {
  const { data } = await api.delete(`/drivers/${id}`);
  return data;
};
