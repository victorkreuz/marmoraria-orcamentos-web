import { useState, useEffect } from 'react';
import { parseMoney } from '../../utils/parsers';
import { formatMoney } from '../../utils/formatters';
import styles from './MoneyInput.module.css';

interface Props {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function MoneyInput({ value, onChange, placeholder, disabled, id }: Props) {
  const [display, setDisplay] = useState(() => (value > 0 ? formatMoney(value) : ''));
  const [focused, setFocused] = useState(false);

  // Só atualiza o display quando o valor muda externamente (não durante digitação)
  useEffect(() => {
    if (!focused) {
      setDisplay(value > 0 ? formatMoney(value) : '');
    }
  }, [value, focused]);

  const handleFocus = () => setFocused(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d,]/g, '');
    setDisplay(raw);
    onChange(parseMoney(raw));
  };

  const handleBlur = () => {
    setFocused(false);
    const num = parseMoney(display);
    setDisplay(num > 0 ? formatMoney(num) : '');
    onChange(num);
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      className={styles.input}
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder ?? '0,00'}
      disabled={disabled}
    />
  );
}
