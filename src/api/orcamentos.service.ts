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

const MODOS: Record<string, { imprimirCapa: boolean; imprimirResumo: boolean; orcamentoObjetivo: boolean; pularItens: boolean }> = {
  completa:  { imprimirCapa: true,  imprimirResumo: true,  orcamentoObjetivo: false, pularItens: false },
  objetiva:  { imprimirCapa: false, imprimirResumo: false, orcamentoObjetivo: true,  pularItens: false },
  totais:    { imprimirCapa: false, imprimirResumo: false, orcamentoObjetivo: true,  pularItens: true  },
};

function toBackendPayload(options: GerarOrcamentoOptions) {
  const modo = MODOS[options.modo] ?? MODOS.completa;
  return {
    opcoes: {
      ...modo,
      imprimirTotal: !options.ocultarTotalGeral,
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
