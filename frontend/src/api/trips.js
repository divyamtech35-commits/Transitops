import api from './index';

export const getTrips = async (filters = {}) => {
  const { data } = await api.get('/trips', { params: filters });
  return data;
};

export const createTrip = async (tripData) => {
  const { data } = await api.post('/trips', tripData);
  return data;
};

export const dispatchTrip = async (id) => {
  const { data } = await api.put(`/trips/${id}/dispatch`);
  return data;
};

export const completeTrip = async (id, completeData) => {
  const { data } = await api.put(`/trips/${id}/complete`, completeData);
  return data;
};

export const cancelTrip = async (id) => {
  const { data } = await api.put(`/trips/${id}/cancel`);
  return data;
};
