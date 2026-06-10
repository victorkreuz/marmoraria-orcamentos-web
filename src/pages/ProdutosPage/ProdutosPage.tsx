import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { ConfirmModal } from '../../components/ConfirmModal/ConfirmModal';
import { ErrorMessage } from '../../components/ErrorMessage/ErrorMessage';
import { MoneyInput } from '../../components/MoneyInput/MoneyInput';
import { getProdutos, createProduto, updateProduto, deleteProduto } from '../../api/produtos.service';
import { uploadImagem } from '../../api/upload.service';
import type { Produto, UnidadeProduto } from '../../types/api.types';
import { formatMoney } from '../../utils/formatters';
import styles from './ProdutosPage.module.css';

interface FormState {
  nome: string;
  unidadeMedida: UnidadeProduto;
  valorUnitario: number;
  imagemUrl: string;
}

const empty: FormState = { nome: '', unidadeMedida: 'UN', valorUnitario: 0, imagemUrl: '' };

export function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Produto | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setProdutos(await getProdutos()); }
    finally { setLoading(false); }
  }

  const filtered = produtos.filter((p) => {
    const q = search.toLowerCase();
    return p.nome.toLowerCase().includes(q) || (p.unidadeMedida ?? '').toLowerCase().includes(q);
  });

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(p: Produto) {
    setEditing(p);
    setForm({ nome: p.nome, unidadeMedida: p.unidadeMedida ?? 'UN', valorUnitario: p.valorUnitario, imagemUrl: p.imagemUrl ?? '' });
    setFormError('');
    setModalOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImagem(file);
      setForm((f) => ({ ...f, imagemUrl: url }));
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.nome.trim()) { setFormError('Nome é obrigatório.'); return; }
    setSaving(true);
    try {
      const payload = { nome: form.nome, unidadeMedida: form.unidadeMedida, valorUnitario: form.valorUnitario, imagemUrl: form.imagemUrl || undefined };
      if (editing) await updateProduto(editing.id, payload);
      else await createProduto(payload);
      setModalOpen(false);
      await load();
    } catch {
      setFormError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduto(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Layout
      title="Produtos e Serviços"
      action={<button className={styles.addBtn} onClick={openCreate}>+ Novo produto</button>}
    >
      <div className={styles.card}>
        <input
          type="text"
          className={styles.search}
          placeholder="Buscar por nome ou unidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {loading ? (
          <p className={styles.loading}>Carregando...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Nome</th>
                <th>Unidade</th>
                <th>Valor unitário</th>
                <th className={styles.actionsCol}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className={styles.empty}>Nenhum produto encontrado.</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.imagemUrl ? (
                      <img src={p.imagemUrl} alt={p.nome} className={styles.thumb} />
                    ) : <span className={styles.noImg}>—</span>}
                  </td>
                  <td className={styles.nameCell}>{p.nome}</td>
                  <td>{p.unidadeMedida ?? '—'}</td>
                  <td>R$ {formatMoney(p.valorUnitario)}</td>
                  <td className={styles.actions}>
                    <button className={styles.iconBtn} onClick={() => openEdit(p)} title="Editar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setDeleteTarget(p)} title="Excluir">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className={styles.overlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{editing ? 'Editar produto' : 'Novo produto'}</h2>
            <div className={styles.modalForm}>
              <div className={styles.field}>
                <label className={styles.label}>Nome *</label>
                <input type="text" className={styles.input} value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Unidade</label>
                <select className={styles.input} value={form.unidadeMedida} onChange={(e) => setForm((f) => ({ ...f, unidadeMedida: e.target.value as UnidadeProduto }))}>
                  <option value="UN">UN</option>
                  <option value="M2">M²</option>
                  <option value="M3">M³</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Valor unitário</label>
                <MoneyInput value={form.valorUnitario} onChange={(v) => setForm((f) => ({ ...f, valorUnitario: v }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Imagem</label>
                {form.imagemUrl && <img src={form.imagemUrl} alt="Preview" className={styles.imgPreview} />}
                <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageUpload} disabled={uploading} />
                {uploading && <span className={styles.uploading}>Enviando...</span>}
              </div>
              <ErrorMessage error={formError} />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving || uploading}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Excluir o produto "${deleteTarget.nome}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </Layout>
  );
}
