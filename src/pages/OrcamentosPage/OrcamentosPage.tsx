import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import { ConfirmModal } from '../../components/ConfirmModal/ConfirmModal';
import { getOrcamentos, deleteOrcamento } from '../../api/orcamentos.service';
import { LoadError } from '../../components/LoadError/LoadError';
import { describeLoadError } from '../../utils/loadError';
import { statusParaExibicao, type Orcamento } from '../../types/api.types';
import { formatMoney, formatDate } from '../../utils/formatters';
import styles from './OrcamentosPage.module.css';

export function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Orcamento | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try { setOrcamentos(await getOrcamentos()); }
    catch (err) { setLoadError(describeLoadError(err)); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteOrcamento(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } finally { setDeleting(false); }
  }

  return (
    <Layout
      title="Orçamentos"
      action={
        <button className={styles.addBtn} onClick={() => navigate('/orcamentos/novo')}>
          + Novo orçamento
        </button>
      }
    >
      <div className={styles.card}>
        {loading ? (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '42px', opacity: 1 - i * 0.08 }} />
            ))}
          </div>
        ) : loadError ? (
          <LoadError message={loadError} onRetry={load} />
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Emissão</th>
                <th>Total</th>
                <th className={styles.actionsCol}></th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.length === 0 ? (
                <tr><td colSpan={6} className={styles.empty}>Nenhum orçamento encontrado.</td></tr>
              ) : orcamentos.map((o) => (
                <tr key={o.id} className={styles.row} onClick={() => navigate(`/orcamentos/${o.id}`)}>
                  <td className={styles.numCell}>{o.numero}</td>
                  <td className={styles.nameCell}>{o.cliente?.nome ?? '—'}</td>
                  <td><StatusBadge status={statusParaExibicao(o)} /></td>
                  <td>{formatDate(o.dataEmissao)}</td>
                  <td>R$ {formatMoney(o.financeiro?.totalFinal ?? o.valorTotal ?? 0)}</td>
                  <td className={styles.actions} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.iconBtn} onClick={() => navigate(`/orcamentos/${o.id}/editar`)} title="Editar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setDeleteTarget(o)} title="Excluir">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal
          message={`Excluir o orçamento ${deleteTarget.numero}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </Layout>
  );
}
