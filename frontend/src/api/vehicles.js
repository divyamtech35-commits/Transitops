import api from './index';

export const getVehicles = async (filters = {}) => {
  const { data } = await api.get('/vehicles', { params: filters });
  // The Appwrite response returns { total, documents: [...] }
  return data;
};

export const createVehicle = async (vehicleData) => {
  const { data } = await api.post('/vehicles', vehicleData);
  return data;
};

export const updateVehicle = async (id, vehicleData) => {
  const { data } = await api.put(`/vehicles/${id}`, vehicleData);
  return data;
};

export const deleteVehicle = async (id) => {
  const { data } = await api.delete(`/vehicles/${id}`);
  return data;
};
