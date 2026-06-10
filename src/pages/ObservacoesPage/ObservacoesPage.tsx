import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { ConfirmModal } from '../../components/ConfirmModal/ConfirmModal';
import { ErrorMessage } from '../../components/ErrorMessage/ErrorMessage';
import {
  getObservacoes, createObservacao, updateObservacao, deleteObservacao,
} from '../../api/observacoes.service';
import {
  getMeiosPagamento, createMeioPagamento, updateMeioPagamento, deleteMeioPagamento,
} from '../../api/meiosPagamento.service';
import type { Observacao, MeioPagamento } from '../../types/api.types';
import styles from './ObservacoesPage.module.css';

type DeleteTarget =
  | { type: 'obs'; item: Observacao }
  | { type: 'meio'; item: MeioPagamento };

export function ObservacoesPage() {
  const [obs, setObs] = useState<Observacao[]>([]);
  const [meios, setMeios] = useState<MeioPagamento[]>([]);
  const [loading, setLoading] = useState(true);

  const [obsModal, setObsModal] = useState(false);
  const [editingObs, setEditingObs] = useState<Observacao | null>(null);
  const [obsTitulo, setObsTitulo] = useState('');
  const [obsTexto, setObsTexto] = useState('');
  const [obsError, setObsError] = useState('');
  const [obsSaving, setObsSaving] = useState(false);

  const [meioModal, setMeioModal] = useState(false);
  const [editingMeio, setEditingMeio] = useState<MeioPagamento | null>(null);
  const [meioTitulo, setMeioTitulo] = useState('');
  const [meioDesc, setMeioDesc] = useState('');
  const [meioError, setMeioError] = useState('');
  const [meioSaving, setMeioSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [o, m] = await Promise.all([getObservacoes(), getMeiosPagamento()]);
      setObs(o);
      setMeios(m);
    } finally {
      setLoading(false);
    }
  }

  // Observacoes
  function openCreateObs() { setEditingObs(null); setObsTitulo(''); setObsTexto(''); setObsError(''); setObsModal(true); }
  function openEditObs(o: Observacao) { setEditingObs(o); setObsTitulo(o.titulo); setObsTexto(o.texto); setObsError(''); setObsModal(true); }

  async function handleSaveObs() {
    if (!obsTitulo.trim()) { setObsError('Título é obrigatório.'); return; }
    setObsSaving(true);
    try {
      if (editingObs) await updateObservacao(editingObs.id, { titulo: obsTitulo, texto: obsTexto });
      else await createObservacao({ titulo: obsTitulo, texto: obsTexto });
      setObsModal(false);
      await load();
    } catch { setObsError('Erro ao salvar.'); }
    finally { setObsSaving(false); }
  }

  // Meios
  function openCreateMeio() { setEditingMeio(null); setMeioTitulo(''); setMeioDesc(''); setMeioError(''); setMeioModal(true); }
  function openEditMeio(m: MeioPagamento) { setEditingMeio(m); setMeioTitulo(m.titulo); setMeioDesc(m.descricao ?? ''); setMeioError(''); setMeioModal(true); }

  async function handleSaveMeio() {
    if (!meioTitulo.trim()) { setMeioError('Título é obrigatório.'); return; }
    setMeioSaving(true);
    try {
      if (editingMeio) await updateMeioPagamento(editingMeio.id, { titulo: meioTitulo, descricao: meioDesc });
      else await createMeioPagamento({ titulo: meioTitulo, descricao: meioDesc });
      setMeioModal(false);
      await load();
    } catch { setMeioError('Erro ao salvar.'); }
    finally { setMeioSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'obs') await deleteObservacao(deleteTarget.item.id);
      else await deleteMeioPagamento(deleteTarget.item.id);
      setDeleteTarget(null);
      await load();
    } finally { setDeleting(false); }
  }

  return (
    <Layout title="Observações e Meios de Pagamento">
      {loading ? <p className={styles.loading}>Carregando...</p> : (
        <div className={styles.grid}>
          {/* Observações */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Observações</h2>
              <button className={styles.addBtn} onClick={openCreateObs}>+ Nova</button>
            </div>
            <div className={styles.card}>
              {obs.length === 0 ? <p className={styles.empty}>Nenhuma observação cadastrada.</p> : (
                <table className={styles.table}>
                  <thead><tr><th>Título</th><th>Texto</th><th className={styles.actionsCol}></th></tr></thead>
                  <tbody>
                    {obs.map((o) => (
                      <tr key={o.id}>
                        <td className={styles.nameCell}>{o.titulo}</td>
                        <td className={styles.textCell}>{o.texto.slice(0, 80)}{o.texto.length > 80 ? '…' : ''}</td>
                        <td className={styles.actions}>
                          <button className={styles.iconBtn} onClick={() => openEditObs(o)} title="Editar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setDeleteTarget({ type: 'obs', item: o })} title="Excluir">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Meios de Pagamento */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Meios de Pagamento</h2>
              <button className={styles.addBtn} onClick={openCreateMeio}>+ Novo</button>
            </div>
            <div className={styles.card}>
              {meios.length === 0 ? <p className={styles.empty}>Nenhum meio de pagamento cadastrado.</p> : (
                <table className={styles.table}>
                  <thead><tr><th>Título</th><th>Descrição</th><th className={styles.actionsCol}></th></tr></thead>
                  <tbody>
                    {meios.map((m) => (
                      <tr key={m.id}>
                        <td className={styles.nameCell}>{m.titulo}</td>
                        <td className={styles.textCell}>{m.descricao ?? '—'}</td>
                        <td className={styles.actions}>
                          <button className={styles.iconBtn} onClick={() => openEditMeio(m)} title="Editar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setDeleteTarget({ type: 'meio', item: m })} title="Excluir">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Modal Observação */}
      {obsModal && (
        <div className={styles.overlay} onClick={() => setObsModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{editingObs ? 'Editar observação' : 'Nova observação'}</h2>
            <div className={styles.modalForm}>
              <div className={styles.field}><label className={styles.label}>Título *</label><input type="text" className={styles.input} value={obsTitulo} onChange={(e) => setObsTitulo(e.target.value)} /></div>
              <div className={styles.field}><label className={styles.label}>Texto</label><textarea className={styles.textarea} rows={5} value={obsTexto} onChange={(e) => setObsTexto(e.target.value)} /></div>
              <ErrorMessage error={obsError} />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setObsModal(false)} disabled={obsSaving}>Cancelar</button>
              <button className={styles.saveBtn} onClick={handleSaveObs} disabled={obsSaving}>{obsSaving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Meio de Pagamento */}
      {meioModal && (
        <div className={styles.overlay} onClick={() => setMeioModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{editingMeio ? 'Editar meio de pagamento' : 'Novo meio de pagamento'}</h2>
            <div className={styles.modalForm}>
              <div className={styles.field}><label className={styles.label}>Título *</label><input type="text" className={styles.input} value={meioTitulo} onChange={(e) => setMeioTitulo(e.target.value)} /></div>
              <div className={styles.field}><label className={styles.label}>Descrição</label><textarea className={styles.textarea} rows={3} value={meioDesc} onChange={(e) => setMeioDesc(e.target.value)} /></div>
              <ErrorMessage error={meioError} />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setMeioModal(false)} disabled={meioSaving}>Cancelar</button>
              <button className={styles.saveBtn} onClick={handleSaveMeio} disabled={meioSaving}>{meioSaving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Excluir "${deleteTarget.item.titulo}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </Layout>
  );
}
