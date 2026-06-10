import httpClient from './httpClient';
import type { Cliente } from '../types/api.types';

export async function getClientes(): Promise<Cliente[]> {
  const res = await httpClient.get<Cliente[]>('/cliente');
  return res.data;
}

export async function createCliente(data: Omit<Cliente, 'id'>): Promise<Cliente> {
  const res = await httpClient.post<Cliente>('/cliente', data);
  return res.data;
}

export async function updateCliente(id: number, data: Omit<Cliente, 'id'>): Promise<Cliente> {
  const res = await httpClient.put<Cliente>(`/cliente/${id}`, data);
  return res.data;
}

export async function deleteCliente(id: number): Promise<void> {
  await httpClient.delete(`/cliente/${id}`);
}
