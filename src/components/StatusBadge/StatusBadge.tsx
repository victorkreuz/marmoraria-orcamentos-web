import { statusLabel } from '../../utils/formatters';
import styles from './StatusBadge.module.css';

interface Props {
  status: string;
}

export function StatusBadge({ status }: Props) {
  return (
    <span className={`${styles.badge} ${styles[status.toLowerCase()]}`}>
      {statusLabel(status)}
    </span>
  );
}
