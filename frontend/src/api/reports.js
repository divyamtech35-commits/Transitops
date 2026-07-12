import api from './index';

export const getFleetReport = async () => {
  const { data } = await api.get('/reports/fleet');
  return data;
};
