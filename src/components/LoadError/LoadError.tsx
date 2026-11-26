import styles from './LoadError.module.css';

interface Props {
  message: string;
  onRetry: () => void;
}

export function LoadError({ message, onRetry }: Props) {
  return (
    <div className={styles.wrapper} role="alert">
      <p className={styles.message}>{message}</p>
      <button type="button" className={styles.retryBtn} onClick={onRetry}>
        Tentar novamente
      </button>
    </div>
  );
}
