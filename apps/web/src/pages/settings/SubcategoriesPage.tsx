// File: apps/web/src/pages/settings/SubcategoriesPage.tsx
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@transdovic/shared';
import { SettingsCRUDPage } from './SettingsCRUDPage';

interface Category {
  id: string;
  name: string;
}

const fetchCategories = async (): Promise<Category[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('categories').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchSubcategoriesWithCategory = async () => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('subcategories')
    .select('id, name, category_id, categories(name)')
    .order('name');
  if (error) throw new Error(error.message);
  return (data || []).map((sc: any) => ({
    ...sc,
    category_name: sc.categories?.name || '—',
  }));
};

export const SubcategoriesPage = () => {
  const { data: categories = [] } = useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

  return (
    <SettingsCRUDPage
      config={{
        tableName: 'subcategories',
        queryKey: 'subcategories',
        title: 'Subcategoría',
        titlePlural: 'Subcategorías',
        icon: 'bx bx-subdirectory-right',
        fetchFn: fetchSubcategoriesWithCategory,
        columns: [
          { key: 'name', label: 'Nombre' },
          { key: 'category_name', label: 'Categoría' },
        ],
        fields: [
          { name: 'name', label: 'Nombre', placeholder: 'Ej. Llantas', required: true },
          {
            name: 'category_id',
            label: 'Categoría',
            type: 'select',
            options: categoryOptions,
            placeholder: 'Seleccionar categoría...',
            required: true,
          },
        ],
        searchFields: ['name', 'category_name'],
        getSubLabel: (item) => item.category_name,
      }}
    />
  );
};