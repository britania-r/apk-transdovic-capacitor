// File: apps/web/src/components/ui/SimpleSelect.tsx
import { useState, useRef, useEffect } from 'react';
import styles from './SimpleSelect.module.css';

export interface SimpleSelectOption {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  options: SimpleSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

const DROPDOWN_HEIGHT = 174; // ~4 opciones × 40px + 8px padding
const MARGIN = 8;

export const SimpleSelect = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  disabled = false,
  required = false,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUp, setOpensUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = options.find(o => o.value === value);

  // Detectar si hay espacio abajo, si no abrir hacia arriba
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setOpensUp(spaceBelow < DROPDOWN_HEIGHT + MARGIN);
  }, [isOpen]);

  // Cerrar al click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {label && (
        <span className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </span>
      )}

      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerActive : ''} ${disabled ? styles.triggerDisabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className={selected ? styles.triggerText : styles.triggerPlaceholder}>
          {selected ? selected.label : placeholder}
        </span>
        <i className={`bx bx-chevron-down ${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}></i>
      </button>

      {isOpen && (
        <div className={`${styles.dropdown} ${opensUp ? styles.dropdownUp : styles.dropdownDown}`}>
          <div className={styles.optionsList}>
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                className={`${styles.option} ${option.value === value ? styles.optionSelected : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                {option.value === value && (
                  <i className="bx bx-check" style={{ color: 'var(--color-primary)', fontSize: '16px', flexShrink: 0 }}></i>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};