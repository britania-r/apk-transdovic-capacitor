// File: apps/web/src/components/ui/SearchableSelect.tsx
import { useState, useRef, useEffect } from 'react';
import styles from './SearchableSelect.module.css';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface Props {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  emptyMessage?: string;
}

export const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  label,
  disabled = false,
  emptyMessage = 'Sin resultados'
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.value === value);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus en input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {label && <span className={styles.label}>{label}</span>}

      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerActive : ''} ${disabled ? styles.triggerDisabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className={selectedOption ? styles.triggerText : styles.triggerPlaceholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={styles.triggerIcons}>
          {value && !disabled && (
            <span className={styles.clearButton} onClick={handleClear}>
              <i className="bx bx-x"></i>
            </span>
          )}
          <i className={`bx bx-chevron-down ${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}></i>
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchWrapper}>
            <i className="bx bx-search" style={{ color: '#94a3b8', fontSize: '14px' }}></i>
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.optionsList}>
            {filtered.length === 0 ? (
              <div className={styles.emptyMessage}>{emptyMessage}</div>
            ) : (
              filtered.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.option} ${option.value === value ? styles.optionSelected : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  <span className={styles.optionLabel}>{option.label}</span>
                  {option.sublabel && (
                    <span className={styles.optionSublabel}>{option.sublabel}</span>
                  )}
                  {option.value === value && (
                    <i className="bx bx-check" style={{ color: '#2563eb', fontSize: '16px' }}></i>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};