// File: apps/web/src/pages/settings/CitiesPage.tsx
import { SettingsCRUDPage } from './SettingsCRUDPage';

export const CitiesPage = () => (
  <SettingsCRUDPage
    config={{
      tableName: 'cities',
      queryKey: 'cities',
      title: 'Ciudad',
      titlePlural: 'Ciudades',
      icon: 'bx bx-map',
      columns: [{ key: 'name', label: 'Nombre' }],
      fields: [
        { name: 'name', label: 'Nombre', placeholder: 'Ej. Trujillo', required: true },
      ],
    }}
  />
);