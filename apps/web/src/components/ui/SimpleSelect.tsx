// File: apps/web/src/components/ui/SimpleSelect.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
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

const DROPDOWN_MAX_HEIGHT = 174;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
    opensUp: boolean;
  } | null>(null);

  const selected = options.find(o => o.value === value);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const opensUp = spaceBelow < DROPDOWN_MAX_HEIGHT + 8;

    setDropdownPos({
      top: opensUp ? rect.top - DROPDOWN_MAX_HEIGHT - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      opensUp,
    });
  }, []);

  // Cerrar al click fuera
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
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

  // Calcular posición al abrir
  useEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) updatePosition();
    setIsOpen(!isOpen);
  };

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
        onClick={handleToggle}
        disabled={disabled}
      >
        <span className={selected ? styles.triggerText : styles.triggerPlaceholder}>
          {selected ? selected.label : placeholder}
        </span>
        <i className={`bx bx-chevron-down ${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}></i>
      </button>

      {isOpen && dropdownPos && (
        <div
          ref={dropdownRef}
          className={`${styles.dropdown} ${dropdownPos.opensUp ? styles.dropdownUp : styles.dropdownDown}`}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
          }}
        >
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
                  <i className={`bx bx-check ${styles.checkIcon}`}></i>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};