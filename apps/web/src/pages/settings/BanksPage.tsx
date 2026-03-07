// File: apps/web/src/pages/settings/BanksPage.tsx
import { SettingsCRUDPage } from './SettingsCRUDPage';

// Exportamos el tipo Bank para que otros módulos lo importen desde aquí
export interface Bank {
  id: string;
  name: string;
}

export const BanksPage = () => (
  <SettingsCRUDPage
    config={{
      tableName: 'banks',
      queryKey: 'banks',
      title: 'Banco',
      titlePlural: 'Bancos',
      icon: 'bx bxs-bank',
      columns: [{ key: 'name', label: 'Nombre' }],
      fields: [
        { name: 'name', label: 'Nombre', placeholder: 'Ej. BBVA', required: true },
      ],
    }}
  />
);