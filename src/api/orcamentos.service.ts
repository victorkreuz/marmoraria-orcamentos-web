import httpClient from './httpClient';
import type { Orcamento, GerarOrcamentoOptions } from '../types/api.types';

export async function getOrcamentos(): Promise<Orcamento[]> {
  const res = await httpClient.get<Orcamento[]>('/orcamento');
  return res.data;
}

export async function getOrcamento(id: number): Promise<Orcamento> {
  const res = await httpClient.get<Orcamento>(`/orcamento/${id}`);
  return res.data;
}

// Aceita o payload no formato da entidade do backend (não OrcamentoFormData)
export async function createOrcamento(data: Record<string, unknown>): Promise<Orcamento> {
  const res = await httpClient.post<Orcamento>('/orcamento', data);
  return res.data;
}

export async function updateOrcamento(id: number, data: Record<string, unknown>): Promise<Orcamento> {
  const res = await httpClient.put<Orcamento>(`/orcamento/${id}`, data);
  return res.data;
}

export async function deleteOrcamento(id: number): Promise<void> {
  await httpClient.delete(`/orcamento/${id}`);
}

function toBackendPayload(options: GerarOrcamentoOptions) {
  return {
    opcoes: {
      imprimirCapa: options.comCapa,
      imprimirTotal: !options.ocultarTotalGeral,
      imprimirProjeto: !options.ocultarProjeto,
      imprimirProjetoImagens: !options.ocultarProjetoImagens,
    },
    observacoesDocumento: options.observacoesDocumento || '',
  };
}

export async function previewOrcamentoHtml(id: number, options: GerarOrcamentoOptions): Promise<string> {
  const res = await httpClient.post<string>(`/orcamento/${id}/html`, toBackendPayload(options), {
    responseType: 'text',
  });
  return res.data;
}

export async function downloadOrcamentoPdf(id: number, options: GerarOrcamentoOptions): Promise<Blob> {
  const res = await httpClient.post(`/orcamento/${id}/gerar`, toBackendPayload(options), {
    responseType: 'blob',
  });
  return res.data as Blob;
}
