import httpClient from './httpClient';
import type { Produto } from '../types/api.types';

export async function getProdutos(): Promise<Produto[]> {
  const res = await httpClient.get<Produto[]>('/produto_servico');
  return res.data;
}

export async function createProduto(data: Omit<Produto, 'id'>): Promise<Produto> {
  const res = await httpClient.post<Produto>('/produto_servico', data);
  return res.data;
}

export async function updateProduto(id: number, data: Partial<Omit<Produto, 'id'>>): Promise<Produto> {
  const res = await httpClient.put<Produto>(`/produto_servico/${id}`, data);
  return res.data;
}

export async function deleteProduto(id: number): Promise<void> {
  await httpClient.delete(`/produto_servico/${id}`);
}
