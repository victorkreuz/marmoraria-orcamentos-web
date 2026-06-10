import { useState, useRef, useEffect } from 'react';
import styles from './SearchSelect.module.css';

interface Option {
  id: number;
  label: string;
}

interface Props {
  options: Option[];
  value: number | undefined;
  onChange: (id: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchSelect({ options, value, onChange, placeholder, disabled }: Props) {
  const selectedOption = options.find((o) => o.id === value);
  const [query, setQuery] = useState(selectedOption?.label ?? '');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(selectedOption?.label ?? '');
  }, [value, selectedOption?.label]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (!selectedOption) setQuery('');
        else setQuery(selectedOption.label);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption]);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
    if (e.target.value === '') onChange(undefined);
  };

  const handleSelect = (opt: Option) => {
    onChange(opt.id);
    setQuery(opt.label);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length === 1) handleSelect(filtered[0]);
      else setOpen(false);
    }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <input
        type="text"
        className={styles.input}
        value={query}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Buscar...'}
        disabled={disabled}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className={styles.dropdown}>
          {filtered.map((opt) => (
            <li
              key={opt.id}
              className={`${styles.option} ${opt.id === value ? styles.selected : ''}`}
              onMouseDown={() => handleSelect(opt)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
