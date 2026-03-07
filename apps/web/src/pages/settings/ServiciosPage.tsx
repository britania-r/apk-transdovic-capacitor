// File: apps/web/src/pages/settings/ServiciosPage.tsx
import { SettingsCRUDPage } from './SettingsCRUDPage';

export const ServiciosPage = () => (
  <SettingsCRUDPage
    config={{
      tableName: 'servicios',
      queryKey: 'servicios',
      title: 'Servicio',
      titlePlural: 'Servicios',
      icon: 'bx bx-wrench',
      columns: [{ key: 'name', label: 'Nombre' }],
      fields: [
        { name: 'name', label: 'Nombre', placeholder: 'Ej. Mecánico', required: true },
      ],
    }}
  />
);