// File: apps/web/src/pages/settings/CategoriesPage.tsx
import { SettingsCRUDPage } from './SettingsCRUDPage';

export const CategoriesPage = () => (
  <SettingsCRUDPage
    config={{
      tableName: 'categories',
      queryKey: 'categories',
      title: 'Categoría',
      titlePlural: 'Categorías',
      icon: 'bx bx-category',
      columns: [{ key: 'name', label: 'Nombre' }],
      fields: [
        { name: 'name', label: 'Nombre', placeholder: 'Ej. Repuestos', required: true },
      ],
    }}
  />
);