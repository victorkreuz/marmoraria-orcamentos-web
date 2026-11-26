import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { getOrcamentos } from '../../api/orcamentos.service';
import { LoadError } from '../../components/LoadError/LoadError';
import { describeLoadError } from '../../utils/loadError';
import { statusParaExibicao, type Orcamento } from '../../types/api.types';
import { formatMoney } from '../../utils/formatters';
import styles from './DashboardPage.module.css';

function KpiCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={styles.kpiCard} style={{ borderLeftColor: accent }}>
      <span className={styles.kpiValue}>{value}</span>
      <span className={styles.kpiLabel}>{label}</span>
    </div>
  );
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className={styles.noData}>Sem dados</p>;

  let offset = 0;
  const r = 60;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * r;

  const slices = data.map((d) => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const slice = { ...d, dash, gap, offset };
    offset += dash;
    return slice;
  });

  return (
    <div className={styles.donutWrap}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="24" />
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="24"
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="14" fontWeight="600" fill="#1a1a1a">
          {total}
        </text>
      </svg>
      <ul className={styles.legend}>
        {data.map((d) => (
          <li key={d.label} className={styles.legendItem}>
            <span className={styles.dot} style={{ background: d.color }} />
            {d.label}: {d.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LineChart({ data }: { data: { month: string; count: number }[] }) {
  if (data.every((d) => d.count === 0)) return <p className={styles.noData}>Sem dados</p>;
  const max = Math.max(...data.map((d) => d.count), 1);
  const w = 420;
  const h = 120;
  const padX = 30;
  const padY = 16;
  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * (w - padX * 2);
    const y = padY + (1 - d.count / max) * (h - padY * 2);
    return { x, y, ...d };
  });
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 20}`} className={styles.lineChart}>
      <polyline
        points={polyline}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="var(--color-primary)" />
          <text x={p.x} y={h + 16} textAnchor="middle" fontSize="11" fill="#6b7280">
            {p.month}
          </text>
          {p.count > 0 && (
            <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="10" fill="#374151">
              {p.count}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function getLast6Months(): { month: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('pt-BR', { month: 'short' }),
    };
  });
}

export function DashboardPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try { setOrcamentos(await getOrcamentos()); }
    catch (err) { setLoadError(describeLoadError(err)); }
    finally { setLoading(false); }
  }

  const total = orcamentos.length;
  const pendentes = orcamentos.filter((o) => ['SOLICITADO', 'ENVIADO'].includes(statusParaExibicao(o))).length;
  const aprovados = orcamentos.filter((o) => statusParaExibicao(o) === 'APROVADO').length;
  const valorAprovado = orcamentos
    .filter((o) => statusParaExibicao(o) === 'APROVADO')
    .reduce((s, o) => s + (o.financeiro?.totalFinal ?? o.valorTotal ?? 0), 0);

  const statusCounts: Record<string, number> = {};
  orcamentos.forEach((o) => {
    const status = statusParaExibicao(o);
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  });

  const donutData = [
    { label: 'Aprovado', value: statusCounts['APROVADO'] ?? 0, color: '#22c55e' },
    { label: 'Pendente', value: (statusCounts['SOLICITADO'] ?? 0) + (statusCounts['ENVIADO'] ?? 0), color: '#f59e0b' },
    { label: 'Rejeitado', value: statusCounts['REJEITADO'] ?? 0, color: '#ef4444' },
    { label: 'Outros', value: (statusCounts['EXPIRADO'] ?? 0) + (statusCounts['RASCUNHO'] ?? 0), color: '#9ca3af' },
  ].filter((d) => d.value > 0);

  const last6 = getLast6Months();
  const lineData = last6.map(({ month, label }) => ({
    month: label,
    count: orcamentos.filter(
      (o) => statusParaExibicao(o) === 'APROVADO' && o.dataEmissao?.startsWith(month)
    ).length,
  }));

  return (
    <Layout title="Dashboard">
      {loading ? (
        <p className={styles.loading}>Carregando...</p>
      ) : loadError ? (
        <LoadError message={loadError} onRetry={load} />
      ) : (
        <div className={styles.content}>
          <div className={styles.kpiRow}>
            <KpiCard label="Total de orçamentos" value={String(total)} accent="#170d48" />
            <KpiCard label="Pendentes" value={String(pendentes)} accent="#f59e0b" />
            <KpiCard label="Aprovados" value={String(aprovados)} accent="#22c55e" />
            <KpiCard label="Valor aprovado" value={`R$ ${formatMoney(valorAprovado)}`} accent="#3b82f6" />
          </div>

          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Aprovados — últimos 6 meses</h2>
              <LineChart data={lineData} />
            </div>
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Distribuição por status</h2>
              <DonutChart data={donutData} />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
