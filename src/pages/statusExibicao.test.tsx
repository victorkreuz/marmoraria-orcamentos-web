// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { DashboardPage } from './DashboardPage/DashboardPage';
import { OrcamentosPage } from './OrcamentosPage/OrcamentosPage';
import { OrcamentoDetailPage } from './OrcamentoDetailPage/OrcamentoDetailPage';
import { OrcamentoFormPage } from './OrcamentoFormPage/OrcamentoFormPage';
import { getOrcamentos, getOrcamento } from '../api/orcamentos.service';
import { getObservacoes } from '../api/observacoes.service';
import { getClientes } from '../api/clientes.service';
import { getProdutos } from '../api/produtos.service';
import { getMeiosPagamento } from '../api/meiosPagamento.service';
import { statusParaExibicao, type Orcamento } from '../types/api.types';

vi.mock('../api/orcamentos.service');
vi.mock('../api/observacoes.service');
vi.mock('../api/clientes.service');
vi.mock('../api/produtos.service');
vi.mock('../api/meiosPagamento.service');

function validToken(): string {
  const b64 = (o: object) => btoa(JSON.stringify(o));
  return `${b64({ alg: 'HS256' })}.${b64({ exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
}

// Gravado como ENVIADO, mas com a validade vencida: o backend devolve EXPIRADO em statusExibicao.
function orcamentoVencido(): Orcamento {
  return {
    id: 1,
    numero: '2026-0001',
    statusOrcamento: 'ENVIADO',
    statusExibicao: 'EXPIRADO',
    cliente: { id: 1, nome: 'Cliente Ficticio' },
    dataEmissao: '2026-01-10',
    validadeDias: 15,
    prazoExecucaoDias: 30,
    itemOrcamentoList: [],
    financeiro: { totalFinal: 1000 },
  } as unknown as Orcamento;
}

describe('statusParaExibicao', () => {
  it('usa statusExibicao quando o backend envia', () => {
    expect(statusParaExibicao(orcamentoVencido())).toBe('EXPIRADO');
  });

  it('cai para statusOrcamento quando statusExibicao não vem', () => {
    const o = { ...orcamentoVencido(), statusExibicao: undefined } as unknown as Orcamento;
    expect(statusParaExibicao(o)).toBe('ENVIADO');
  });
});

describe('telas usam statusExibicao; só o formulário de edição usa statusOrcamento', () => {
  beforeEach(() => {
    localStorage.setItem('jwtToken', validToken());
    vi.mocked(getOrcamentos).mockResolvedValue([orcamentoVencido()]);
    vi.mocked(getOrcamento).mockResolvedValue(orcamentoVencido());
    vi.mocked(getObservacoes).mockResolvedValue([]);
    vi.mocked(getClientes).mockResolvedValue([]);
    vi.mocked(getProdutos).mockResolvedValue([]);
    vi.mocked(getMeiosPagamento).mockResolvedValue([]);
  });
  afterEach(() => { cleanup(); localStorage.clear(); });

  it('listagem mostra "Expirado" e não "Enviado"', async () => {
    render(<AuthProvider><MemoryRouter><OrcamentosPage /></MemoryRouter></AuthProvider>);
    expect(await screen.findByText('Expirado')).toBeTruthy();
    expect(screen.queryByText('Enviado')).toBeNull();
  });

  it('detalhe mostra "Expirado" na linha Status (gravado como ENVIADO)', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/orcamentos/1']}>
          <Routes><Route path="/orcamentos/:id" element={<OrcamentoDetailPage />} /></Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
    const linhaStatus = (await screen.findByText('Status')).parentElement;
    expect(linhaStatus?.textContent).toContain('Expirado');
    expect(linhaStatus?.textContent).not.toContain('Enviado');
    expect(screen.queryByText('Enviado')).toBeNull();
  });

  it('dashboard não conta o vencido como pendente e o coloca em "Outros"', async () => {
    render(<AuthProvider><MemoryRouter><DashboardPage /></MemoryRouter></AuthProvider>);
    const pendentes = await screen.findByText('Pendentes');
    expect(pendentes.parentElement?.textContent).toContain('0');
    expect(screen.getByText('Total de orçamentos').parentElement?.textContent).toContain('1');
    expect(screen.getByText(/Outros: 1/)).toBeTruthy();
    expect(screen.queryByText(/Pendente: /)).toBeNull();
  });

  it('formulário de edição mantém o status gravado (ENVIADO), não o calculado', async () => {
    const { container } = render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/orcamentos/1/editar']}>
          <Routes><Route path="/orcamentos/:id/editar" element={<OrcamentoFormPage />} /></Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
    await waitFor(() => {
      const selects = Array.from(container.querySelectorAll('select'));
      expect(selects.some((s) => s.value === 'ENVIADO')).toBe(true);
    });
    expect(Array.from(container.querySelectorAll('select')).some((s) => s.value === 'EXPIRADO')).toBe(false);
  });
});
