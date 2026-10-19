/*------------------Serviço para obter dados do dashboard------------------*/

import {api} from './api'; // Sua instância configurada do Axios
import type { DashboardData } from '../types/dashboard';

export const getDashboardData = async (): Promise<DashboardData> => {
  const token = localStorage.getItem('token'); // Ajuste a chave se usar outro nome (ex: 'access_token')
  const response = await api.get<DashboardData>('/admin/dashboard', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};