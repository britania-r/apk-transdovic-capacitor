// File: apps/web/src/pages/settings/BotiquinPage.tsx
import { SettingsCRUDPage } from './SettingsCRUDPage';

export const BotiquinPage = () => (
  <SettingsCRUDPage
    config={{
      tableName: 'botiquin_items',
      queryKey: 'botiquin_items',
      title: 'Item de botiquín',
      titlePlural: 'Botiquín',
      icon: 'bx bx-first-aid',
      columns: [{ key: 'name', label: 'Nombre' }],
      fields: [
        { name: 'name', label: 'Nombre', placeholder: 'Ej. Pastillas', required: true },
      ],
    }}
  />
);