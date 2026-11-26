// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import App from '../App';

vi.mock('../api/orcamentos.service');

function tokenWithExp(expSeconds: number): string {
  const b64 = (o: object) => btoa(JSON.stringify(o));
  return `${b64({ alg: 'HS256' })}.${b64({ exp: expSeconds })}.sig`;
}

describe('token vencido no localStorage', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/dashboard');
  });
  afterEach(() => { cleanup(); localStorage.clear(); });

  it('abrir /dashboard com token vencido leva para a tela de login, sem mostrar a moldura', () => {
    localStorage.setItem('jwtToken', tokenWithExp(Math.floor(Date.now() / 1000) - 3600));
    render(<App />);

    expect(window.location.pathname).toBe('/login');
    expect(screen.getByLabelText('Usuário')).toBeTruthy();
    expect(screen.queryByText('Dashboard')).toBeNull();
    expect(screen.queryByText('Carregando...')).toBeNull();
    // token vencido é descartado
    expect(localStorage.getItem('jwtToken')).toBeNull();
  });

  it('sem nenhum token também vai para o login', () => {
    render(<App />);
    expect(window.location.pathname).toBe('/login');
  });

  it('token válido continua abrindo o dashboard', async () => {
    localStorage.setItem('jwtToken', tokenWithExp(Math.floor(Date.now() / 1000) + 3600));
    const { getOrcamentos } = await import('../api/orcamentos.service');
    vi.mocked(getOrcamentos).mockResolvedValue([]);
    render(<App />);
    expect(window.location.pathname).toBe('/dashboard');
    expect(await screen.findByText('Total de orçamentos')).toBeTruthy();
  });
});
