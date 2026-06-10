import httpClient from './httpClient';
import type { MeioPagamento } from '../types/api.types';

export async function getMeiosPagamento(): Promise<MeioPagamento[]> {
  const res = await httpClient.get<MeioPagamento[]>('/meios_pagamento');
  return res.data;
}

export async function createMeioPagamento(data: Omit<MeioPagamento, 'id'>): Promise<MeioPagamento> {
  const res = await httpClient.post<MeioPagamento>('/meios_pagamento', data);
  return res.data;
}

export async function updateMeioPagamento(id: number, data: Omit<MeioPagamento, 'id'>): Promise<MeioPagamento> {
  const res = await httpClient.put<MeioPagamento>(`/meios_pagamento/${id}`, data);
  return res.data;
}

export async function deleteMeioPagamento(id: number): Promise<void> {
  await httpClient.delete(`/meios_pagamento/${id}`);
}
