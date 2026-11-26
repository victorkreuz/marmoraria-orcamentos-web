// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError } from 'axios';
import { AuthProvider } from '../contexts/AuthContext';
import { DashboardPage } from './DashboardPage/DashboardPage';
import { OrcamentosPage } from './OrcamentosPage/OrcamentosPage';
import { ClientesPage } from './ClientesPage/ClientesPage';
import { ProdutosPage } from './ProdutosPage/ProdutosPage';
import { getOrcamentos } from '../api/orcamentos.service';
import { getClientes } from '../api/clientes.service';
import { getProdutos } from '../api/produtos.service';

vi.mock('../api/orcamentos.service');
vi.mock('../api/clientes.service');
vi.mock('../api/produtos.service');

function validToken(): string {
  const b64 = (o: object) => btoa(JSON.stringify(o));
  return `${b64({ alg: 'HS256' })}.${b64({ exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
}

function serverError(status: number): AxiosError {
  return new AxiosError('fail', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status, data: {}, statusText: '', headers: {}, config: {} as never,
  });
}

const pages = [
  { name: 'Dashboard', Page: DashboardPage, mock: getOrcamentos },
  { name: 'Orçamentos', Page: OrcamentosPage, mock: getOrcamentos },
  { name: 'Clientes', Page: ClientesPage, mock: getClientes },
  { name: 'Produtos', Page: ProdutosPage, mock: getProdutos },
];

describe.each(pages)('$name: falha ao carregar dados', ({ Page, mock }) => {
  const fn = vi.mocked(mock as () => Promise<unknown[]>);

  beforeEach(() => {
    localStorage.setItem('jwtToken', validToken());
    fn.mockReset();
  });
  afterEach(() => { cleanup(); localStorage.clear(); });

  function renderPage() {
    return render(
      <AuthProvider>
        <MemoryRouter><Page /></MemoryRouter>
      </AuthProvider>,
    );
  }

  it('mostra mensagem de erro e botão "Tentar novamente" quando o servidor devolve 500', async () => {
    fn.mockRejectedValue(serverError(500));
    renderPage();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeTruthy();
    expect(screen.queryByText('Carregando...')).toBeNull();
  });

  it('mostra o erro também quando o servidor está fora do ar (sem resposta)', async () => {
    fn.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'));
    renderPage();
    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('não mostra tela de erro para 401/403 (o login assume)', async () => {
    fn.mockRejectedValue(serverError(401));
    renderPage();
    await waitFor(() => expect(fn).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Carregando...')).toBeNull());
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).toBeNull();
  });

  it('"Tentar novamente" busca os dados de novo e remove o erro quando dá certo', async () => {
    fn.mockRejectedValueOnce(serverError(500)).mockResolvedValueOnce([]);
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
