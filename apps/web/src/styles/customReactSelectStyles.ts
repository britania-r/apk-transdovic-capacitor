// File: apps/web/src/styles/customReactSelectStyles.ts

import type { StylesConfig } from 'react-select';

const customReactSelectStyles: StylesConfig = {
  control: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: 'var(--color-bg-secondary)',
    borderColor: state.isFocused ? 'var(--color-primary)' : 'var(--color-border)',
    boxShadow: state.isFocused ? `0 0 0 1px var(--color-primary)` : 'none',
    '&:hover': {
      borderColor: 'var(--color-primary)',
    },
    color: 'var(--color-text)',
  }),
  menu: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  }),
  option: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: state.isSelected
      ? 'var(--color-primary)'
      : state.isFocused
      ? 'var(--color-bg)'
      : 'var(--color-bg-secondary)',
    color: state.isSelected ? 'white' : 'var(--color-text)',
    '&:active': {
      backgroundColor: 'var(--color-primary-dark)',
    },
  }),
  singleValue: (baseStyles) => ({
    ...baseStyles,
    color: 'var(--color-text)',
  }),
  input: (baseStyles) => ({
    ...baseStyles,
    color: 'var(--color-text)',
  }),
  placeholder: (baseStyles) => ({
    ...baseStyles,
    color: 'var(--color-text-secondary)',
  }),
  // ... puedes agregar más personalizaciones si es necesario
};

export default customReactSelectStyles;