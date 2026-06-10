import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { MoneyInput } from '../../components/MoneyInput/MoneyInput';
import { SearchSelect } from '../../components/SearchSelect/SearchSelect';
import { ImageUpload } from '../../components/ImageUpload/ImageUpload';
import { ErrorMessage } from '../../components/ErrorMessage/ErrorMessage';
import { getClientes } from '../../api/clientes.service';
import { getProdutos } from '../../api/produtos.service';
import { getMeiosPagamento } from '../../api/meiosPagamento.service';
import { getOrcamento, createOrcamento, updateOrcamento } from '../../api/orcamentos.service';
import type {
  Cliente, Produto, MeioPagamento, OrcamentoStatus, OrcamentoImagem,
} from '../../types/api.types';
import { formatMoney } from '../../utils/formatters';
import styles from './OrcamentoFormPage.module.css';

interface ItemForm {
  produtoId?: number;
  nome: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  imagens: OrcamentoImagem[];
}

function emptyItem(): ItemForm {
  return { nome: '', descricao: '', quantidade: 1, precoUnitario: 0, desconto: 0, imagens: [] };
}

function itemSubtotal(item: ItemForm): number {
  return Math.max(0, item.quantidade * item.precoUnitario - item.desconto);
}

export function OrcamentoFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [meiosPagamento, setMeiosPagamento] = useState<MeioPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Campos do orçamento
  const [numero, setNumero] = useState('');
  const [clienteId, setClienteId] = useState<number | undefined>();
  const [status, setStatus] = useState<OrcamentoStatus>('RASCUNHO');
  const [dataEmissao, setDataEmissao] = useState(() => new Date().toISOString().split('T')[0]);
  const [validadeDias, setValidadeDias] = useState(15);
  const [prazoExecucaoDias, setPrazoExecucaoDias] = useState(30);

  // Projeto
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [pedraPrincipal, setPedraPrincipal] = useState('');
  const [observacoesProjeto, setObservacoesProjeto] = useState('');
  const [responsavelTecnico, setResponsavelTecnico] = useState('');
  const [imagensProjeto, setImagensProjeto] = useState<OrcamentoImagem[]>([]);

  // Itens
  const [itens, setItens] = useState<ItemForm[]>([emptyItem()]);

  // Financeiro
  const [freteIncluso, setFreteIncluso] = useState(false);
  const [valorFrete, setValorFrete] = useState(0);
  const [descontoPorcentagem, setDescontoPorcentagem] = useState(0);
  const [descontoReais, setDescontoReais] = useState(0);
  const [adendos, setAdendos] = useState(0);
  const [meioPagamentoId, setMeioPagamentoId] = useState<number | undefined>();

  const subtotalItens = itens.reduce((s, item) => s + itemSubtotal(item), 0);
  const freteValor = !freteIncluso ? valorFrete : 0;
  const totalFinal = Math.max(0, subtotalItens + freteValor - descontoReais + adendos);

  const handleDescontoPct = useCallback((pct: number) => {
    setDescontoPorcentagem(pct);
    setDescontoReais(parseFloat(((pct / 100) * subtotalItens).toFixed(2)));
  }, [subtotalItens]);

  const handleDescontoReais = useCallback((reais: number) => {
    setDescontoReais(reais);
    setDescontoPorcentagem(subtotalItens > 0 ? parseFloat(((reais / subtotalItens) * 100).toFixed(2)) : 0);
  }, [subtotalItens]);

  useEffect(() => {
    async function init() {
      try {
        const [c, p, m] = await Promise.all([getClientes(), getProdutos(), getMeiosPagamento()]);
        setClientes(c);
        setProdutos(p);
        setMeiosPagamento(m);

        if (isEdit && id) {
          const orc = await getOrcamento(Number(id));
          setNumero(orc.numero);
          setClienteId(orc.cliente?.id);
          setStatus(orc.statusOrcamento);               // backend: statusOrcamento
          setDataEmissao(orc.dataEmissao);
          setValidadeDias(orc.validadeDias);
          setPrazoExecucaoDias(orc.prazoExecucaoDias);
          setNomeProjeto(orc.projeto?.nome ?? '');                        // backend: projeto.nome
          setPedraPrincipal(orc.projeto?.tipoPedraPrincipal ?? '');       // backend: projeto.tipoPedraPrincipal
          setObservacoesProjeto(orc.projeto?.observacoes ?? '');           // backend: projeto.observacoes
          setResponsavelTecnico(orc.projeto?.responsavelTecnico ?? '');    // backend: projeto.responsavelTecnico
          setImagensProjeto(orc.projeto?.imagens ?? []);                   // backend: projeto.imagens
          setItens((orc.itemOrcamentoList ?? []).map((it) => ({            // backend: itemOrcamentoList
            produtoId: it.produtoServico?.id,                             // backend: produtoServico
            nome: it.nome,
            descricao: it.descricao ?? '',
            quantidade: it.quantidade,
            precoUnitario: Number(it.precoUnitario ?? 0),
            desconto: Number(it.valorDesconto ?? 0),                      // backend: valorDesconto
            imagens: it.imagens ?? [],
          })));
          setFreteIncluso(orc.financeiro?.freteIncluso ?? false);          // backend: financeiro.freteIncluso
          setValorFrete(Number(orc.financeiro?.freteExtra ?? orc.valorFrete ?? 0)); // backend: financeiro.freteExtra
          setDescontoPorcentagem(Number(orc.financeiro?.descontoPercentual ?? 0));  // backend: financeiro.descontoPercentual
          setDescontoReais(Number(orc.financeiro?.descontoValorReais ?? 0));        // backend: financeiro.descontoValorReais
          setAdendos(Number(orc.financeiro?.adendos ?? 0));                         // backend: financeiro.adendos
          setMeioPagamentoId(orc.financeiro?.meioPagamentoId ?? undefined);         // backend: financeiro.meioPagamentoId
        }
      } catch {
        setError('Erro ao carregar dados. Verifique sua conexão e tente novamente.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id, isEdit]);

  function updateItem(index: number, patch: Partial<ItemForm>) {
    setItens((prev) => prev.map((item, i) => i === index ? { ...item, ...patch } : item));
  }

  function addItem() {
    setItens((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  function selectProduto(index: number, prodId: number | undefined) {
    if (!prodId) { updateItem(index, { produtoId: undefined }); return; }
    const prod = produtos.find((p) => p.id === prodId);
    if (prod) {
      updateItem(index, {
        produtoId: prod.id,
        nome: prod.nome,
        precoUnitario: prod.valorUnitario,
      });
    }
  }

  const meioPagamentoSelecionado = meiosPagamento.find((m) => m.id === meioPagamentoId);

  async function handleSubmit() {
    if (!clienteId) { setError('Selecione um cliente.'); return; }
    if (itens.some((i) => !i.nome.trim())) { setError('Todos os itens precisam de nome.'); return; }
    setError('');
    setSaving(true);
    try {
      // Payload estruturado conforme as entidades do backend
      const payload = {
        cliente: { id: clienteId },
        statusOrcamento: status,
        dataEmissao,
        validadeDias,
        prazoExecucaoDias,
        projeto: {
          nome: nomeProjeto || null,
          tipoPedraPrincipal: pedraPrincipal || null,
          observacoes: observacoesProjeto || null,
          responsavelTecnico: responsavelTecnico || null,
          imagens: imagensProjeto,
        },
        itemOrcamentoList: itens.map((it) => ({
          produtoServico: it.produtoId ? { id: it.produtoId } : null,
          nome: it.nome,
          descricao: it.descricao || null,
          quantidade: it.quantidade,
          precoUnitario: it.precoUnitario,
          valorUnitario: it.precoUnitario,   // ItemOrcamentoService usa valorUnitario no cálculo
          valorDesconto: it.desconto,
          subtotal: itemSubtotal(it),
          imagens: it.imagens,
        })),
        financeiro: {
          freteIncluso,
          freteExtra: !freteIncluso ? valorFrete : 0,
          descontoPercentual: descontoPorcentagem,
          descontoValorReais: descontoReais,
          adendos,
          meioPagamentoId: meioPagamentoId ?? null,
        },
        // Campos de nível raiz usados pelo OrcamentoService.calcularValorTotal()
        valorDesconto: descontoReais,
        valorFrete: !freteIncluso ? valorFrete : 0,
      };

      if (isEdit && id) {
        await updateOrcamento(Number(id), payload);
      } else {
        const created = await createOrcamento(payload);
        navigate(`/orcamentos/${created.id}`);
        return;
      }
      navigate(`/orcamentos/${id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string; fields?: Record<string, string> } } };
      const status = axiosErr?.response?.status;
      const data = axiosErr?.response?.data;
      if (data?.fields) {
        const msgs = Object.entries(data.fields).map(([f, m]) => `${f}: ${m}`).join('; ');
        setError(`Dados inválidos: ${msgs}`);
      } else if (status === 409) {
        setError('Erro ao salvar: conflito de dados. Verifique os itens e tente novamente.');
      } else if (status === 400) {
        setError(data?.message ?? 'Dados inválidos. Verifique os campos e tente novamente.');
      } else {
        setError('Erro ao salvar orçamento. Verifique os dados e tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Layout title={isEdit ? 'Editar Orçamento' : 'Novo Orçamento'}><p className={styles.loading}>Carregando...</p></Layout>;

  return (
    <Layout
      title={isEdit ? `Editar Orçamento ${numero}` : 'Novo Orçamento'}
      action={
        <div className={styles.headerActions}>
          <button className={styles.cancelBtn} onClick={() => navigate(-1)} disabled={saving}>Cancelar</button>
          <button className={styles.saveBtn} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar orçamento'}
          </button>
        </div>
      }
    >
      <div className={styles.form}>
        {/* Dados do Orçamento */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Dados do Orçamento</h2>
          <div className={styles.grid3}>
            {isEdit && (
              <div className={styles.field}>
                <label className={styles.label}>Número</label>
                <input type="text" className={styles.input} value={numero} readOnly />
              </div>
            )}
            <div className={styles.field}>
              <label className={styles.label}>Cliente *</label>
              <SearchSelect
                options={clientes.map((c) => ({ id: c.id, label: c.nome }))}
                value={clienteId}
                onChange={setClienteId}
                placeholder="Buscar cliente..."
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <select className={styles.input} value={status} onChange={(e) => setStatus(e.target.value as OrcamentoStatus)}>
                <option value="RASCUNHO">Rascunho</option>
                <option value="SOLICITADO">Solicitado</option>
                <option value="ENVIADO">Enviado</option>
                <option value="APROVADO">Aprovado</option>
                <option value="REJEITADO">Rejeitado</option>
                <option value="EXPIRADO">Expirado</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Data de emissão</label>
              <input type="date" className={styles.input} value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Validade (dias)</label>
              <select className={styles.input} value={validadeDias} onChange={(e) => setValidadeDias(Number(e.target.value))}>
                <option value={15}>15 dias</option>
                <option value={30}>30 dias</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Prazo de execução (dias)</label>
              <input type="number" className={styles.input} min={1} value={prazoExecucaoDias} onChange={(e) => setPrazoExecucaoDias(Number(e.target.value))} />
            </div>
          </div>
        </section>

        {/* Projeto */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Projeto</h2>
          <div className={styles.grid3}>
            <div className={styles.field}>
              <label className={styles.label}>Nome do projeto</label>
              <input type="text" className={styles.input} value={nomeProjeto} onChange={(e) => setNomeProjeto(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Pedra principal</label>
              <input type="text" className={styles.input} value={pedraPrincipal} onChange={(e) => setPedraPrincipal(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Responsável técnico</label>
              <input type="text" className={styles.input} value={responsavelTecnico} onChange={(e) => setResponsavelTecnico(e.target.value)} />
            </div>
          </div>
          <div className={styles.field} style={{ marginTop: '0.75rem' }}>
            <label className={styles.label}>Observações do projeto</label>
            <textarea className={styles.textarea} rows={3} value={observacoesProjeto} onChange={(e) => setObservacoesProjeto(e.target.value)} />
          </div>
          <div className={styles.field} style={{ marginTop: '0.75rem' }}>
            <label className={styles.label}>Imagens do projeto</label>
            <ImageUpload images={imagensProjeto} onChange={setImagensProjeto} />
          </div>
        </section>

        {/* Itens */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Itens</h2>
          <div className={styles.itemsList}>
            {itens.map((item, index) => (
              <div key={index} className={styles.itemCard}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemNum}>Item {index + 1}</span>
                  {itens.length > 1 && (
                    <button type="button" className={styles.removeItemBtn} onClick={() => removeItem(index)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
                <div className={styles.grid3}>
                  <div className={styles.field}>
                    <label className={styles.label}>Produto</label>
                    <SearchSelect
                      options={produtos.map((p) => ({ id: p.id, label: p.nome }))}
                      value={item.produtoId}
                      onChange={(pId) => selectProduto(index, pId)}
                      placeholder="Buscar produto..."
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Nome *</label>
                    <input type="text" className={styles.input} value={item.nome} onChange={(e) => updateItem(index, { nome: e.target.value })} />
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Qtd</label>
                      <input type="number" className={styles.input} min={0.01} step={0.01} value={item.quantidade} onChange={(e) => updateItem(index, { quantidade: Number(e.target.value) })} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Preço unit.</label>
                      <MoneyInput value={item.precoUnitario} onChange={(v) => updateItem(index, { precoUnitario: v })} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Desconto</label>
                      <MoneyInput value={item.desconto} onChange={(v) => updateItem(index, { desconto: v })} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Subtotal</label>
                      <input type="text" className={`${styles.input} ${styles.readonly}`} value={`R$ ${formatMoney(itemSubtotal(item))}`} readOnly />
                    </div>
                  </div>
                </div>
                <div className={styles.field} style={{ marginTop: '0.5rem' }}>
                  <label className={styles.label}>Descrição</label>
                  <textarea className={styles.textarea} rows={2} value={item.descricao} onChange={(e) => updateItem(index, { descricao: e.target.value })} />
                </div>
                <div className={styles.field} style={{ marginTop: '0.5rem' }}>
                  <label className={styles.label}>Imagens do item</label>
                  <ImageUpload images={item.imagens} onChange={(imgs) => updateItem(index, { imagens: imgs })} />
                </div>
              </div>
            ))}
          </div>
          <button type="button" className={styles.addItemBtn} onClick={addItem}>
            + Adicionar item
          </button>
        </section>

        {/* Financeiro */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Financeiro</h2>
          <div className={styles.grid3}>
            <div className={styles.field}>
              <label className={styles.label}>Subtotal dos itens</label>
              <input type="text" className={`${styles.input} ${styles.readonly}`} value={`R$ ${formatMoney(subtotalItens)}`} readOnly />
            </div>
            <div className={styles.checkboxField}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={freteIncluso} onChange={(e) => setFreteIncluso(e.target.checked)} />
                Frete incluso
              </label>
            </div>
            {!freteIncluso && (
              <div className={styles.field}>
                <label className={styles.label}>Valor do frete</label>
                <MoneyInput value={valorFrete} onChange={setValorFrete} />
              </div>
            )}
            <div className={styles.field}>
              <label className={styles.label}>Desconto %</label>
              <input
                type="number"
                className={styles.input}
                min={0}
                max={100}
                step={0.01}
                value={descontoPorcentagem}
                onChange={(e) => handleDescontoPct(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Desconto R$</label>
              <MoneyInput value={descontoReais} onChange={handleDescontoReais} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Adendos</label>
              <MoneyInput value={adendos} onChange={setAdendos} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Meio de pagamento</label>
              <select
                className={styles.input}
                value={meioPagamentoId ?? ''}
                onChange={(e) => setMeioPagamentoId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Selecionar...</option>
                {meiosPagamento.map((m) => (
                  <option key={m.id} value={m.id}>{m.titulo}</option>
                ))}
              </select>
            </div>
            {meioPagamentoSelecionado?.descricao && (
              <div className={styles.field}>
                <label className={styles.label}>Descrição do pagamento</label>
                <input type="text" className={`${styles.input} ${styles.readonly}`} value={meioPagamentoSelecionado.descricao} readOnly />
              </div>
            )}
          </div>

          <div className={styles.totalBox}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>R$ {formatMoney(subtotalItens)}</span>
            </div>
            {!freteIncluso && valorFrete > 0 && (
              <div className={styles.totalRow}>
                <span>Frete</span>
                <span>R$ {formatMoney(valorFrete)}</span>
              </div>
            )}
            {descontoReais > 0 && (
              <div className={styles.totalRow}>
                <span>Desconto</span>
                <span>- R$ {formatMoney(descontoReais)}</span>
              </div>
            )}
            {adendos !== 0 && (
              <div className={styles.totalRow}>
                <span>Adendos</span>
                <span>R$ {formatMoney(adendos)}</span>
              </div>
            )}
            <div className={`${styles.totalRow} ${styles.totalFinal}`}>
              <span>Total final</span>
              <span>R$ {formatMoney(totalFinal)}</span>
            </div>
          </div>
        </section>

        <ErrorMessage error={error} />

        <div className={styles.formActions}>
          <button className={styles.cancelBtn} onClick={() => navigate(-1)} disabled={saving}>Cancelar</button>
          <button className={styles.saveBtn} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar orçamento'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
