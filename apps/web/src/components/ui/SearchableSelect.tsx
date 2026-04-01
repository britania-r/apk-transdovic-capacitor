// File: apps/web/src/components/ui/SearchableSelect.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
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
  required?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
}

export const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  label,
  required,
  disabled = false,
  emptyMessage = 'Sin resultados',
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const selectedOption = options.find(o => o.value === value);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  // Calcular posición del dropdown (position: fixed)
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 280; // max height aprox

    const top = spaceBelow >= dropdownHeight
      ? rect.bottom + 4
      : rect.top - dropdownHeight - 4;

    setDropdownPos({
      top: Math.max(4, top),
      left: rect.left,
      width: rect.width,
    });
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // También verificar el dropdown fijo
        const dropdown = document.getElementById('searchable-select-dropdown');
        if (dropdown && dropdown.contains(e.target as Node)) return;
        setIsOpen(false);
        setSearch('');
      }
    };

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updatePosition]);

  // Focus en input al abrir
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen, updatePosition]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
    if (isOpen) setSearch('');
  };

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
      {label && (
        <label className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerActive : ''} ${disabled ? styles.triggerDisabled : ''}`}
        onClick={handleToggle}
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

      {isOpen && dropdownPos && (
        <div
          id="searchable-select-dropdown"
          className={styles.dropdown}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: Math.max(dropdownPos.width, 220),
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.searchWrapper}>
            <i className={`bx bx-search ${styles.searchIcon}`}></i>
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
                    <i className={`bx bx-check ${styles.checkIcon}`}></i>
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