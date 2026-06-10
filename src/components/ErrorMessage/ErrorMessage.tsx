import styles from './ErrorMessage.module.css';

interface Props {
  error?: string;
}

export function ErrorMessage({ error }: Props) {
  if (!error) return null;
  return <span className={styles.error}>{error}</span>;
}
