import api from './index';

export const getExpenses = async (filters = {}) => {
  const { data } = await api.get('/expenses', { params: filters });
  return data;
};

export const createExpense = async (expenseData) => {
  const { data } = await api.post('/expenses', expenseData);
  return data;
};
