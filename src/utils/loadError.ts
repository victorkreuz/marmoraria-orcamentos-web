import axios from 'axios';

/** 401/403: o httpClient já limpa o token e redireciona para /login. */
export function isAuthError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 401 || status === 403;
}

/**
 * Mensagem para exibir quando o carregamento de dados falha.
 * Retorna `null` para 401/403 (o redirecionamento ao login cuida disso;
 * não deve aparecer tela de erro com botão de repetir).
 */
export function describeLoadError(error: unknown): string | null {
  if (isAuthError(error)) return null;

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (!error.response) {
      return error.code === 'ECONNABORTED'
        ? 'O servidor demorou demais para responder.'
        : 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    }
    if (status && status >= 500) return 'O servidor encontrou um erro ao carregar os dados.';
  }
  return 'Não foi possível carregar os dados.';
}
