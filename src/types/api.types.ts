export interface LoginRequest {
  username: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
}

export type OrcamentoStatus =
  | 'SOLICITADO'
  | 'ENVIADO'
  | 'APROVADO'
  | 'REJEITADO'
  | 'EXPIRADO'
  | 'RASCUNHO';

export type UnidadeProduto = 'M2' | 'M3' | 'UN';

export interface Cliente {
  id: number;
  nome: string;
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
}

export interface Produto {
  id: number;
  nome: string;
  unidadeMedida: UnidadeProduto;
  valorUnitario: number;
  imagemUrl?: string;
}

export interface Observacao {
  id: number;
  titulo: string;
  texto: string;
}

export interface MeioPagamento {
  id: number;
  titulo: string;
  descricao?: string;
}

export interface OrcamentoImagem {
  id?: number;
  url: string;
  titulo?: string;
}

// ── Estrutura real retornada pelo backend ──────────────────────────────────

export interface OrcamentoProjeto {
  nome?: string;
  tipoPedraPrincipal?: string;
  observacoes?: string;
  responsavelTecnico?: string;
  fotoPrincipalUrl?: string;
  imagens?: OrcamentoImagem[];
}

export interface OrcamentoFinanceiro {
  subtotalItens?: number;
  freteExtra?: number;
  freteIncluso?: boolean;
  descontoPercentual?: number;
  descontoValorReais?: number;
  adendos?: number;
  totalFinal?: number;
  valorAVista?: number;
  meioPagamentoId?: number;
  meioPagamentoTitulo?: string;
  meioPagamentoDescricao?: string;
}

export interface OrcamentoItem {
  id?: number;
  produtoServico?: Produto;
  nome: string;
  descricao?: string;
  quantidade: number;
  precoUnitario?: number;
  valorDesconto?: number;
  subtotal?: number;
  valorTotal?: number;
  imagens?: OrcamentoImagem[];
}

export interface Orcamento {
  id: number;
  numero: string;
  /** Valor bruto gravado no banco — usar apenas no formulário de edição. */
  statusOrcamento: OrcamentoStatus;
  /** Status calculado (Solicitado/Enviado vencidos viram Expirado) — usar em badges, contadores e filtros. */
  statusExibicao: OrcamentoStatus;
  cliente: Cliente;
  dataEmissao: string;
  validadeDias: number;
  prazoExecucaoDias: number;
  projeto?: OrcamentoProjeto;
  itemOrcamentoList: OrcamentoItem[];
  financeiro?: OrcamentoFinanceiro;
  valorTotal?: number;
  valorDesconto?: number;
  valorFrete?: number;
}

/**
 * Status a usar em badges, contadores e filtros: prefere o valor calculado pelo backend
 * (`statusExibicao`) e cai para o valor bruto (`statusOrcamento`) quando ausente — proteção
 * caso este frontend seja implantado antes do backend passar a enviar `statusExibicao`.
 */
export function statusParaExibicao(o: Orcamento): OrcamentoStatus {
  return o.statusExibicao ?? o.statusOrcamento;
}

// ── Payload enviado para salvar/editar ────────────────────────────────────

export interface OrcamentoItemFormData {
  produtoId?: number;
  nome: string;
  descricao?: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  imagens?: OrcamentoImagem[];
}

export interface OrcamentoFormData {
  clienteId?: number;
  status: OrcamentoStatus;
  dataEmissao: string;
  validadeDias: number;
  prazoExecucaoDias: number;
  nomeProjeto?: string;
  pedraPrincipal?: string;
  observacoesProjeto?: string;
  responsavelTecnico?: string;
  imagensProjeto?: OrcamentoImagem[];
  itens: OrcamentoItemFormData[];
  freteIncluso: boolean;
  valorFrete: number;
  descontoPorcentagem: number;
  descontoReais: number;
  adendos: number;
  meioPagamentoId?: number;
}

export interface GerarOrcamentoOptions {
  comCapa: boolean;
  ocultarTotalGeral: boolean;
  ocultarProjeto: boolean;
  observacoesDocumento: string;
}

export interface ApiError {
  field?: string;
  message: string;
}
