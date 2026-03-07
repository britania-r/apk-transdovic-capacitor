// File: apps/web/src/pages/settings/UnitsPage.tsx
import { SettingsCRUDPage } from './SettingsCRUDPage';

export const UnitsPage = () => (
  <SettingsCRUDPage
    config={{
      tableName: 'units',
      queryKey: 'units',
      title: 'Unidad',
      titlePlural: 'Unidades',
      icon: 'bx bx-ruler',
      columns: [{ key: 'name', label: 'Nombre' }],
      fields: [
        { name: 'name', label: 'Nombre', placeholder: 'Ej. Kg', required: true },
      ],
    }}
  />
);