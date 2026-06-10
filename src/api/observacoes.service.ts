import httpClient from './httpClient';
import type { Observacao } from '../types/api.types';

export async function getObservacoes(): Promise<Observacao[]> {
  const res = await httpClient.get<Observacao[]>('/observacoes');
  return res.data;
}

export async function createObservacao(data: Omit<Observacao, 'id'>): Promise<Observacao> {
  const res = await httpClient.post<Observacao>('/observacoes', data);
  return res.data;
}

export async function updateObservacao(id: number, data: Omit<Observacao, 'id'>): Promise<Observacao> {
  const res = await httpClient.put<Observacao>(`/observacoes/${id}`, data);
  return res.data;
}

export async function deleteObservacao(id: number): Promise<void> {
  await httpClient.delete(`/observacoes/${id}`);
}
