import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { ConfirmModal } from '../../components/ConfirmModal/ConfirmModal';
import { ErrorMessage } from '../../components/ErrorMessage/ErrorMessage';
import { getClientes, createCliente, updateCliente, deleteCliente } from '../../api/clientes.service';
import type { Cliente } from '../../types/api.types';
import { formatCpfCnpj, formatTelefone } from '../../utils/formatters';
import styles from './ClientesPage.module.css';

interface FormState {
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
}

const empty: FormState = { nome: '', cpfCnpj: '', email: '', telefone: '', endereco: '', cidade: '' };

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try { setClientes(await getClientes()); }
    finally { setLoading(false); }
  }

  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nome.toLowerCase().includes(q) ||
      (c.cpfCnpj ?? '').includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.cidade ?? '').toLowerCase().includes(q)
    );
  });

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(c: Cliente) {
    setEditing(c);
    setForm({ nome: c.nome, cpfCnpj: c.cpfCnpj ?? '', email: c.email ?? '', telefone: c.telefone ?? '', endereco: c.endereco ?? '', cidade: c.cidade ?? '' });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) { setFormError('Nome é obrigatório.'); return; }
    setSaving(true);
    try {
      // Backend valida CPF/CNPJ e telefone apenas com dígitos — remove a máscara antes de enviar
      const payload = {
        ...form,
        cpfCnpj: form.cpfCnpj.replace(/\D/g, '') || undefined,
        telefone: form.telefone.replace(/\D/g, '') || undefined,
      };
      if (editing) {
        await updateCliente(editing.id, payload);
      } else {
        await createCliente(payload);
      }
      setModalOpen(false);
      await load();
    } catch {
      setFormError('Erro ao salvar. Verifique os dados e tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteCliente(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      const status = axiosErr?.response?.status;
      const msg = axiosErr?.response?.data?.message;
      if (status === 409) {
        setDeleteError('Este cliente possui orçamentos vinculados e não pode ser excluído. Exclua os orçamentos primeiro.');
      } else {
        setDeleteError(msg ?? 'Erro ao excluir cliente. Tente novamente.');
      }
    } finally {
      setDeleting(false);
    }
  }

  const field = (key: keyof FormState, label: string, type = 'text', mask?: (v: string) => string) => (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input
        type={type}
        className={styles.input}
        value={form[key]}
        onChange={(e) => {
          const val = mask ? mask(e.target.value) : e.target.value;
          setForm((f) => ({ ...f, [key]: val }));
        }}
      />
    </div>
  );

  return (
    <Layout
      title="Clientes"
      action={
        <button className={styles.addBtn} onClick={openCreate}>
          + Novo cliente
        </button>
      }
    >
      <div className={styles.card}>
        <input
          type="text"
          className={styles.search}
          placeholder="Buscar por nome, CPF/CNPJ, e-mail ou cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p className={styles.loading}>Carregando...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF/CNPJ</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Cidade</th>
                <th className={styles.actionsCol}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className={styles.empty}>Nenhum cliente encontrado.</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id}>
                  <td className={styles.nameCell}>{c.nome}</td>
                  <td>{c.cpfCnpj ? formatCpfCnpj(c.cpfCnpj) : '—'}</td>
                  <td>{c.email ?? '—'}</td>
                  <td>{c.telefone ? formatTelefone(c.telefone) : '—'}</td>
                  <td>{c.cidade ?? '—'}</td>
                  <td className={styles.actions}>
                    <button className={styles.iconBtn} onClick={() => openEdit(c)} title="Editar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setDeleteTarget(c)} title="Excluir">
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
            <h2 className={styles.modalTitle}>{editing ? 'Editar cliente' : 'Novo cliente'}</h2>
            <div className={styles.modalForm}>
              {field('nome', 'Nome *')}
              {field('cpfCnpj', 'CPF / CNPJ', 'text', formatCpfCnpj)}
              {field('email', 'E-mail', 'email')}
              {field('telefone', 'Telefone', 'text', formatTelefone)}
              {field('endereco', 'Endereço')}
              {field('cidade', 'Cidade')}
              <ErrorMessage error={formError} />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Excluir o cliente "${deleteTarget.nome}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDelete}
          onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
          loading={deleting}
          error={deleteError}
        />
      )}
    </Layout>
  );
}
