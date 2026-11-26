import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import { getOrcamento, previewOrcamentoHtml } from '../../api/orcamentos.service';
import { getObservacoes } from '../../api/observacoes.service';
import { statusParaExibicao, type Orcamento, type Observacao } from '../../types/api.types';
import { formatMoney, formatDate } from '../../utils/formatters';
import styles from './OrcamentoDetailPage.module.css';

export function OrcamentoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [observacoes, setObservacoes] = useState<Observacao[]>([]);

  const OBS_PADRAO =
    'As pedras naturais apresentam variações de cor, veios e textura — características inerentes ao material e que não configuram defeito.\n' +
    'O prazo de produção inicia-se após a aprovação formal do orçamento e o pagamento da entrada acordada.\n' +
    'Alterações nas medidas ou especificações após aprovação podem implicar em ajuste de valor e novo prazo de produção.\n' +
    'O valor desta proposta é válido até a data de vencimento informada. Após esse prazo, novo orçamento poderá ser necessário.\n' +
    'A produção somente é iniciada após aprovação formal e pagamento combinado. Medições finais são realizadas antes da fabricação.';

  const [comCapa, setComCapa] = useState(false);
  const [ocultarTotalGeral, setOcultarTotalGeral] = useState(false);
  const [ocultarProjeto, setOcultarProjeto] = useState(false);
  const [observacoesDocumento, setObservacoesDocumento] = useState(OBS_PADRAO);
  const [gerando, setGerando] = useState(false);
  const [docError, setDocError] = useState('');

  function opcoes() {
    return { comCapa, ocultarTotalGeral, ocultarProjeto, observacoesDocumento };
  }

  async function handlePreview() {
    if (!id) return;
    setDocError('');
    setGerando(true);
    try {
      const html = await previewOrcamentoHtml(Number(id), opcoes());
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    } catch {
      setDocError('Erro ao gerar pré-visualização. Tente novamente.');
    } finally {
      setGerando(false);
    }
  }

  async function handleDownloadPdf() {
    if (!id) return;
    setDocError('');
    setGerando(true);
    try {
      const html = await previewOrcamentoHtml(Number(id), opcoes());
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.onload = () => win.print();
        setTimeout(() => { try { win.print(); } catch { /* já imprimiu */ } }, 1200);
      }
    } catch {
      setDocError('Erro ao gerar documento. Tente novamente.');
    } finally {
      setGerando(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    getOrcamento(Number(id))
      .then((orc) => setOrcamento(orc))
      .finally(() => setLoading(false));
    getObservacoes().then(setObservacoes).catch(() => {});
  }, [id]);

  if (loading) return (
    <Layout title="Orçamento">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[120, 180, 240, 140].map((h, i) => (
            <div key={i} className="skeleton" style={{ height: `${h}px` }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: '420px' }} />
      </div>
    </Layout>
  );
  if (!orcamento) return <Layout title="Orçamento"><p className={styles.loading}>Orçamento não encontrado.</p></Layout>;

  return (
    <Layout
      title={`Orçamento ${orcamento.numero ?? orcamento.id}`}
      action={
        <div className={styles.headerActions}>
          <button className={styles.editBtn} onClick={() => navigate(`/orcamentos/${id}/editar`)}>
            Editar
          </button>
        </div>
      }
    >
      <div className={styles.layout}>
        <div className={styles.main}>
          {/* Dados gerais */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Dados do Orçamento</h2>
            <div className={styles.grid2}>
              <Row label="Número" value={orcamento.numero} />
              <Row label="Status" value={<StatusBadge status={statusParaExibicao(orcamento)} />} />
              <Row label="Cliente" value={orcamento.cliente?.nome} />
              <Row label="Emissão" value={formatDate(orcamento.dataEmissao)} />
              <Row label="Validade" value={`${orcamento.validadeDias} dias`} />
              <Row label="Prazo execução" value={`${orcamento.prazoExecucaoDias} dias`} />
            </div>
          </section>

          {/* Projeto */}
          {(orcamento.projeto?.nome || orcamento.projeto?.tipoPedraPrincipal || orcamento.projeto?.observacoes) && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Projeto</h2>
              <div className={styles.grid2}>
                {orcamento.projeto?.nome && <Row label="Nome" value={orcamento.projeto.nome} />}
                {orcamento.projeto?.tipoPedraPrincipal && <Row label="Pedra principal" value={orcamento.projeto.tipoPedraPrincipal} />}
                {orcamento.projeto?.responsavelTecnico && <Row label="Responsável" value={orcamento.projeto.responsavelTecnico} />}
              </div>
              {orcamento.projeto?.observacoes && (
                <div className={styles.textBlock}>
                  <span className={styles.rowLabel}>Observações</span>
                  <p className={styles.preservedText}>{orcamento.projeto.observacoes}</p>
                </div>
              )}
              {orcamento.projeto?.imagens && orcamento.projeto.imagens.length > 0 && (
                <div className={styles.imagesWrap}>
                  {orcamento.projeto.imagens.map((img, i) => (
                    <div key={i} className={styles.imgItem}>
                      <img src={img.url} alt={img.titulo || `Imagem ${i + 1}`} className={styles.imgPreview} />
                      {img.titulo && <span className={styles.imgTitle}>{img.titulo}</span>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Itens */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Itens</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Qtd</th>
                  <th>Preço unit.</th>
                  <th>Desconto</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(orcamento.itemOrcamentoList ?? []).map((item, i) => (
                  <tr key={i}>
                    <td className={styles.numCell}>{i + 1}</td>
                    <td>
                      <div className={styles.itemName}>{item.nome}</div>
                      {item.descricao && <p className={styles.itemDesc}>{item.descricao}</p>}
                    </td>
                    <td>{item.quantidade}</td>
                    <td>R$ {formatMoney(item.precoUnitario ?? 0)}</td>
                    <td>{(item.valorDesconto ?? 0) > 0 ? `R$ ${formatMoney(item.valorDesconto!)}` : '—'}</td>
                    <td className={styles.subtotalCell}>R$ {formatMoney(item.subtotal ?? item.valorTotal ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Financeiro */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Financeiro</h2>
            <div className={styles.totalBox}>
              <TotalRow label="Subtotal" value={`R$ ${formatMoney(orcamento.financeiro?.subtotalItens ?? 0)}`} />
              {!orcamento.financeiro?.freteIncluso && (orcamento.financeiro?.freteExtra ?? orcamento.valorFrete ?? 0) > 0 && (
                <TotalRow label="Frete" value={`R$ ${formatMoney(orcamento.financeiro?.freteExtra ?? orcamento.valorFrete ?? 0)}`} />
              )}
              {(orcamento.financeiro?.descontoValorReais ?? 0) > 0 && (
                <TotalRow
                  label={`Desconto (${orcamento.financeiro?.descontoPercentual ?? 0}%)`}
                  value={`- R$ ${formatMoney(orcamento.financeiro!.descontoValorReais!)}`}
                />
              )}
              {(orcamento.financeiro?.adendos ?? 0) !== 0 && <TotalRow label="Adendos" value={`R$ ${formatMoney(orcamento.financeiro!.adendos!)}`} />}
              {orcamento.financeiro?.meioPagamentoTitulo && <TotalRow label="Pagamento" value={orcamento.financeiro.meioPagamentoTitulo} />}
              <TotalRow label="Total final" value={`R$ ${formatMoney(orcamento.financeiro?.totalFinal ?? orcamento.valorTotal ?? 0)}`} highlight />
            </div>
          </section>
        </div>

        {/* Painel de geração */}
        <aside className={styles.aside}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Gerar Documento</h2>
            <div className={styles.modosList}>
              <ModoCapaOption value={true} current={comCapa} onChange={setComCapa} label="Com capa" desc="Capa + identificação, projeto, itens e totais" />
              <ModoCapaOption value={false} current={comCapa} onChange={setComCapa} label="Sem capa" desc="Identificação, projeto, itens e totais" />
            </div>
            <div className={styles.optionsList}>
              <CheckboxOption label="Ocultar total geral" checked={ocultarTotalGeral} onChange={setOcultarTotalGeral} />
              <CheckboxOption label="Ocultar informações do projeto" checked={ocultarProjeto} onChange={setOcultarProjeto} />
            </div>
            {observacoes.length > 0 && (
              <div className={styles.obsSelect}>
                <label className={styles.label}>Carregar modelo de observação</label>
                <select
                  className={styles.select}
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value === '__padrao__') {
                      setObservacoesDocumento(OBS_PADRAO);
                    } else {
                      const obs = observacoes.find((o) => String(o.id) === e.target.value);
                      if (obs) setObservacoesDocumento(obs.texto);
                    }
                  }}
                >
                  <option value="" disabled>Selecionar...</option>
                  <option value="__padrao__">Padrão do sistema</option>
                  {observacoes.map((obs) => (
                    <option key={obs.id} value={String(obs.id)}>{obs.titulo}</option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.obsDocumento}>
              <label className={styles.label}>Observações do documento</label>
              <textarea
                className={styles.obsDocumentoTextarea}
                rows={7}
                value={observacoesDocumento}
                onChange={(e) => setObservacoesDocumento(e.target.value)}
              />
            </div>

            <div className={styles.genActions}>
              <button className={styles.previewBtn} onClick={handlePreview} disabled={gerando}>
                {gerando ? 'Gerando...' : 'Pré-visualizar'}
              </button>
              <button className={styles.downloadBtn} onClick={handleDownloadPdf} disabled={gerando}>
                {gerando ? 'Gerando...' : 'Imprimir / Salvar PDF'}
              </button>
            </div>
            {docError && (
              <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.5rem' }}>{docError}</p>
            )}
          </section>
        </aside>
      </div>
    </Layout>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.125rem' }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: '#1a1a1a', fontWeight: 500 }}>{value ?? '—'}</span>
    </div>
  );
}

function TotalRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? styles.totalRowHighlight : styles.totalRow}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function CheckboxOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={styles.checkboxLabel}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function ModoCapaOption({ value, current, onChange, label, desc }: {
  value: boolean;
  current: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc: string;
}) {
  const active = value === current;
  return (
    <label className={`${styles.modoOption} ${active ? styles.modoOptionActive : ''}`}>
      <input type="radio" name="modoDocumento" checked={active} onChange={() => onChange(value)} />
      <div>
        <span className={styles.modoLabel}>{label}</span>
        <span className={styles.modoDesc}>{desc}</span>
      </div>
    </label>
  );
}
