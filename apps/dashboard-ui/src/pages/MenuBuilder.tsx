import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi, uploadFile, UPLOADS_ORIGIN } from '../api/client';
import { compressImageToWebP } from '../utils/image-compression';
import { useAuth0 } from '@auth0/auth0-react';
import { Plus, X, Languages, ChevronDown, ChevronUp, Pencil, Trash2, Download } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { Breadcrumb } from '../components/Breadcrumb';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useTierLimits } from '../hooks/useTierLimits';

const categorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  cover_image_url: z.string().optional().or(z.literal('')),
});
type CategoryForm = z.infer<typeof categorySchema>;
const itemSchema = z.object({
  name: z.string().min(2, 'Item name is required'),
  description: z.string().optional(),
  price: z.union([z.string(), z.number()])
    .transform(val => {
      if (typeof val === 'number') return val;
      const parsed = parseFloat(String(val).replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    })
    .refine(val => val >= 0, 'Price must be 0 or more'),
  image_url: z.string().optional().or(z.literal('')),
  is_vegan: z.boolean().optional().default(false),
  is_gluten_free: z.boolean().optional().default(false),
  allergens: z.string().optional().default(''),
  calories: z.union([z.string(), z.number()])
    .transform(val => {
      if (val === '' || val === null || val === undefined) return undefined;
      const p = parseInt(String(val));
      return isNaN(p) ? undefined : p;
    })
    .optional(),
  protein: z.union([z.string(), z.number()])
    .transform(val => {
      if (val === '' || val === null || val === undefined) return undefined;
      const p = parseFloat(String(val).replace(',', '.'));
      return isNaN(p) ? undefined : p;
    })
    .optional(),
  carbohydrates: z.union([z.string(), z.number()])
    .transform(val => {
      if (val === '' || val === null || val === undefined) return undefined;
      const p = parseFloat(String(val).replace(',', '.'));
      return isNaN(p) ? undefined : p;
    })
    .optional(),
  fat: z.union([z.string(), z.number()])
    .transform(val => {
      if (val === '' || val === null || val === undefined) return undefined;
      const p = parseFloat(String(val).replace(',', '.'));
      return isNaN(p) ? undefined : p;
    })
    .optional(),
  ingredients: z.string().optional().default(''),
});

type ItemFormInput = z.input<typeof itemSchema>;
type ItemFormOutput = z.output<typeof itemSchema>;

// ---------------------------------------------------------------------------
// MenuBuilder (page root)
// ---------------------------------------------------------------------------

export const MenuBuilder = () => {
  const { getAccessTokenSilently } = useAuth0();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Active translation focus language state ('all' or specific language code)
  const [activeTabLanguage, setActiveTabLanguage] = useState<string>('all');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema)
  });

  const watchCoverImageUrl = watch('cover_image_url');

  // Fetch current menu (for breadcrumb + menu name)
  const { data: menu } = useQuery({
    queryKey: ['menu', id],
    queryFn: () => fetchApi(`/menus/${id}`, {}, getAccessTokenSilently),
    enabled: !!id,
  });

  // Venues list — already cached from Overview; derive venue for breadcrumb
  const { data: venues } = useQuery({
    queryKey: ['venues'],
    queryFn: () => fetchApi('/venues', {}, getAccessTokenSilently),
  });

  const venue = venues?.find((v: any) => v.id === menu?.venue_id);

  // Load languages for switcher bar (all configured languages)
  const activeOrgId = localStorage.getItem('active_org_id');
  const { data: orgLanguages } = useQuery({
    queryKey: ['org-languages', activeOrgId],
    queryFn: () => fetchApi(`/organizations/${activeOrgId}/languages`, {}, getAccessTokenSilently),
    enabled: !!activeOrgId,
  });
  const allOrgLanguages = orgLanguages ?? [];

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', id],
    queryFn: () => fetchApi(`/menus/${id}/categories`, {}, getAccessTokenSilently)
  });

  const { limits, checkCategoryLimit, tier } = useTierLimits();
  const categoryCount = categories?.length || 0;
  const isCategoryLimitReached = !checkCategoryLimit(categoryCount);

  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryForm) => fetchApi(`/menus/${id}/categories`, {
      method: 'POST',
      body: JSON.stringify({ name: data.name, cover_image_url: data.cover_image_url || undefined, sort_order: 0 })
    }, getAccessTokenSilently),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', id] });
      setIsAddingCategory(false);
      reset();
    }
  });

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const compressedFile = await compressImageToWebP(file);
      const res = await uploadFile(compressedFile, getAccessTokenSilently);
      setValue('cover_image_url', res.url);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExportPrices = async () => {
    if (!venue?.id) return;
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`/api/venues/${venue.id}/export-prices`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fiyat-listesi-${venue.slug}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Failed to export price list: ' + err.message);
    }
  };

  const breadcrumbItems = [
    { label: 'Venues', to: '/venues' },
    ...(venue ? [{ label: venue.name, to: `/venues/${venue.id}/menus` }] : []),
    { label: 'Menus', to: venue ? `/venues/${venue.id}/menus` : '/venues' },
    { label: menu?.name ?? '…' },
  ];

  return (
    <div>
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Builder</h1>
          {menu?.name && <p className="text-sm text-gray-500 mt-1">Managing: {menu.name}</p>}
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          {venue?.country_code === 'TR' && (
            <button
              onClick={handleExportPrices}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <Download size={18} className="mr-2" />
              Export Prices (CSV)
            </button>
          )}
          {isCategoryLimitReached ? (
            <Link
              to="/billing"
              className="flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors cursor-pointer font-medium text-sm shadow-sm"
            >
              <Plus size={18} className="mr-2" />
              Upgrade to Add Category ({categoryCount}/{limits.categories})
            </Link>
          ) : (
            <button
              onClick={() => setIsAddingCategory(!isAddingCategory)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              {isAddingCategory ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
              {isAddingCategory ? 'Cancel' : 'Add Category'}
            </button>
          )}
        </div>
      </div>

      {isCategoryLimitReached && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <p className="font-bold">You've reached your category limit for this menu</p>
            <p className="text-xs opacity-90">Your current plan ({tier}) allows up to {limits.categories} categories per menu. Upgrade to add more categories.</p>
          </div>
          <Link to="/billing" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
            Upgrade Now
          </Link>
        </div>
      )}

      {/* Language switcher bar in admin panel */}
      {allOrgLanguages.length > 0 && (
        <div className="flex items-center gap-2 mb-6 bg-white p-3 rounded-xl border border-gray-150 shadow-sm overflow-x-auto">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 whitespace-nowrap">Translation Focus:</span>
          <button
            onClick={() => setActiveTabLanguage('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTabLanguage === 'all' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Languages
          </button>
          {allOrgLanguages.map((lang: any) => (
            <button
              key={lang.language_code}
              onClick={() => setActiveTabLanguage(lang.language_code)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTabLanguage === lang.language_code 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {lang.language_name} ({lang.language_code.toUpperCase()}) {lang.is_default ? '★' : ''}
            </button>
          ))}
        </div>
      )}

      {isAddingCategory && (
        <form onSubmit={handleSubmit(d => createCategoryMutation.mutate(d))} className="mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name (English — fallback)</label>
              <input
                {...register('name')}
                placeholder="e.g. Starters"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
              <input
                id="cover_image_file"
                type="file"
                accept="image/*"
                onChange={handleCategoryImageUpload}
                disabled={isUploading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              {isUploading && <p className="text-sm text-indigo-600 mt-1">Uploading...</p>}
              {watchCoverImageUrl && !isUploading && (
                <img src={`${UPLOADS_ORIGIN}${watchCoverImageUrl}`} alt="Preview" className="mt-2 h-16 w-16 object-cover rounded" />
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createCategoryMutation.isPending || isUploading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Uploading Image...' : createCategoryMutation.isPending ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {isLoading ? (
          <p>Loading categories...</p>
        ) : categories?.length > 0 ? (
          categories.map((cat: any) => (
            <CategoryBlock 
              key={cat.id} 
              category={cat} 
              menuId={id!} 
              allOrgLanguages={allOrgLanguages} 
              activeTabLanguage={activeTabLanguage} 
            />
          ))
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-100">
            <p className="text-gray-500 mb-4">No categories yet. Add one to start building your menu!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// TranslationPanel — auto-saves on blur (debounced)
// ---------------------------------------------------------------------------

interface TranslationPanelProps {
  type: 'category' | 'item';
  entityId: string;
  languages: any[];   // all org languages
  getAccessTokenSilently: () => Promise<string>;
  activeTabLanguage: string;
}
const TranslationPanel = ({ type, entityId, languages, getAccessTokenSilently, activeTabLanguage }: TranslationPanelProps) => {
  const endpoint = type === 'category'
    ? `/categories/${entityId}/translations`
    : `/items/${entityId}/translations`;

  const { data: translations, isLoading } = useQuery({
    queryKey: ['translations', type, entityId],
    queryFn: () => fetchApi(endpoint, {}, getAccessTokenSilently),
    enabled: languages.length > 0,
  });

  const [values, setValues] = useState<Record<string, { name: string; description: string; ingredients: string }>>({});
  const valuesRef = useRef(values);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  useEffect(() => {
    if (translations) {
      const newValues: Record<string, { name: string; description: string; ingredients: string }> = {};
      languages.forEach((lang) => {
        const tr = translations.find((t: any) => t.language_code === lang.language_code);
        newValues[lang.language_code] = {
          name: tr?.name ?? '',
          description: tr?.description ?? '',
          ingredients: tr?.ingredients ?? '',
        };
      });
      setValues(newValues);
    }
  }, [translations, languages]);

  const saveTimer = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const triggerSave = useCallback((langCode: string) => {
    clearTimeout(saveTimer.current[langCode]);
    saveTimer.current[langCode] = setTimeout(async () => {
      const currentVal = valuesRef.current[langCode];
      if (!currentVal) return;
      
      const body = type === 'category'
        ? { name: currentVal.name }
        : { name: currentVal.name, description: currentVal.description, ingredients: currentVal.ingredients };

      try {
        await fetchApi(`${endpoint}/${langCode}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        }, getAccessTokenSilently);
      } catch (err: any) {
        console.error('Failed to save translation:', err);
      }
    }, 600);
  }, [endpoint, type, getAccessTokenSilently]);

  const handleChange = (langCode: string, field: 'name' | 'description' | 'ingredients', val: string) => {
    setValues((prev) => ({
      ...prev,
      [langCode]: {
        ...prev[langCode],
        [field]: val,
      },
    }));
    triggerSave(langCode);
  };

  const filteredLanguages = activeTabLanguage === 'all'
    ? languages
    : languages.filter(l => l.language_code === activeTabLanguage);

  if (filteredLanguages.length === 0) return null;
  if (isLoading) return <p className="text-xs text-gray-400 px-1">Loading translations...</p>;

  return (
    <div className="space-y-4">
      {filteredLanguages.map((lang: any) => {
        const val = values[lang.language_code] || { name: '', description: '', ingredients: '' };
        return (
          <div key={lang.language_code} className="grid grid-cols-1 md:grid-cols-2 gap-3 border-l-2 border-indigo-200 pl-3 py-1">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {lang.language_name} ({lang.language_code.toUpperCase()}) — Name
              </label>
              <input
                value={val.name}
                onChange={e => handleChange(lang.language_code, 'name', e.target.value)}
                placeholder="Translation…"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>
            {type === 'item' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {lang.language_name} ({lang.language_code.toUpperCase()}) — Description
                  </label>
                  <input
                    value={val.description}
                    onChange={e => handleChange(lang.language_code, 'description', e.target.value)}
                    placeholder="Translation…"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {lang.language_name} ({lang.language_code.toUpperCase()}) — Ingredients
                  </label>
                  <textarea
                    value={val.ingredients}
                    onChange={e => handleChange(lang.language_code, 'ingredients', e.target.value)}
                    placeholder="Ingredients Translation…"
                    rows={2}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// CategoryBlock
// ---------------------------------------------------------------------------

interface CategoryBlockProps {
  category: any;
  menuId: string;
  allOrgLanguages: any[];
  activeTabLanguage: string;
}

const CategoryBlock = ({ category, menuId, allOrgLanguages, activeTabLanguage }: CategoryBlockProps) => {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  
  // Category Edit state
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditUploading, setIsEditUploading] = useState(false);
  
  // Category Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ItemFormInput, unknown, ItemFormOutput>({
    resolver: zodResolver(itemSchema) as any,
  });

  const watchItemImageUrl = watch('image_url');

  // Category Edit Form Hook
  const { register: registerEdit, handleSubmit: handleSubmitEdit, setValue: setEditValue, watch: watchEdit, reset: resetCategoryEdit, formState: { errors: editErrors } } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name,
      cover_image_url: category.cover_image_url ?? '',
    }
  });

  const editCoverImageUrl = watchEdit('cover_image_url');

  const { data: items, isLoading } = useQuery({
    queryKey: ['items', category.id],
    queryFn: () => fetchApi(`/categories/${category.id}/items`, {}, getAccessTokenSilently)
  });

  const { limits, checkItemLimit } = useTierLimits();
  const itemCount = items?.length || 0;
  const isItemLimitReached = !checkItemLimit(itemCount);
  const createItemMutation = useMutation({
    mutationFn: (data: ItemFormOutput) => fetchApi(`/categories/${category.id}/items`, {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        price: data.price,
        image_url: data.image_url || undefined,
        is_available: true,
        is_vegan: data.is_vegan,
        is_gluten_free: data.is_gluten_free,
        allergens: data.allergens,
        calories: data.calories,
        protein: data.protein,
        carbohydrates: data.carbohydrates,
        fat: data.fat,
        ingredients: data.ingredients,
      })
    }, getAccessTokenSilently),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', category.id] });
      setIsAddingItem(false);
      reset();
    }
  });

  const editCategoryMutation = useMutation({
    mutationFn: (data: CategoryForm) =>
      fetchApi(`/categories/${category.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: data.name,
          cover_image_url: data.cover_image_url || null,
        }),
      }, getAccessTokenSilently),
    onSuccess: (updated) => {
      queryClient.setQueryData(['categories', menuId], (prev: any[]) =>
        prev?.map(c => c.id === updated.id ? updated : c)
      );
      setIsEditingCategory(false);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: () =>
      fetchApi(`/categories/${category.id}`, {
        method: 'DELETE',
      }, getAccessTokenSilently),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', menuId] });
      setShowDeleteDialog(false);
    },
  });

  const toggleCategoryMutation = useMutation({
    mutationFn: (isActive: boolean) =>
      fetchApi(`/categories/${category.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
      }, getAccessTokenSilently),
    onSuccess: (updated) => {
      queryClient.setQueryData(['categories', menuId], (prev: any[]) =>
        prev?.map(c => c.id === updated.id ? updated : c)
      );
    },
  });

  const toggleItemMutation = useMutation({
    mutationFn: ({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) =>
      fetchApi(`/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_available: isAvailable }),
      }, getAccessTokenSilently),
    onSuccess: (updated) => {
      queryClient.setQueryData(['items', category.id], (prev: any[]) =>
        prev?.map(i => i.id === updated.id ? updated : i)
      );
    },
  });

  const handleItemImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const compressedFile = await compressImageToWebP(file);
      const res = await uploadFile(compressedFile, getAccessTokenSilently);
      setValue('image_url', res.url);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditCategoryCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsEditUploading(true);
    try {
      const compressedFile = await compressImageToWebP(file);
      const res = await uploadFile(compressedFile, getAccessTokenSilently);
      setEditValue('cover_image_url', res.url, { shouldDirty: true });
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsEditUploading(false);
    }
  };

  const startEditingCategory = () => {
    resetCategoryEdit({
      name: category.name,
      cover_image_url: category.cover_image_url ?? '',
    });
    setIsEditingCategory(true);
  };

  const isInactive = !category.is_active;

  // Auto-expand translation fields if a specific focus language is selected
  const shouldShowTranslations = showTranslations || activeTabLanguage !== 'all';

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-opacity ${isInactive ? 'opacity-60 border-gray-200' : 'border-gray-200'}`}>
      {/* Category Cover Image Preview */}
      {category.cover_image_url && !isEditingCategory && (
        <div className="w-full h-32 overflow-hidden">
          <img
            src={`${UPLOADS_ORIGIN}${category.cover_image_url}`}
            alt={category.name}
            className={`w-full h-full object-cover ${isInactive ? 'grayscale' : ''}`}
          />
        </div>
      )}

      {/* Category Header or Edit Form */}
      {isEditingCategory ? (
        <form onSubmit={handleSubmitEdit(d => editCategoryMutation.mutate(d))} className="p-6 bg-gray-50 border-b border-gray-200 space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Edit Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name (English — fallback)</label>
              <input
                {...registerEdit('name')}
                placeholder="Category Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
              {editErrors.name && <p className="mt-1 text-sm text-red-600">{editErrors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Cover Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleEditCategoryCoverUpload}
                disabled={isEditUploading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              {isEditUploading && <p className="text-sm text-indigo-600 mt-1">Uploading...</p>}
              {editCoverImageUrl && !isEditUploading && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={`${UPLOADS_ORIGIN}${editCoverImageUrl}`} alt="Cover preview" className="h-16 w-16 object-cover rounded" />
                  <button 
                    type="button" 
                    onClick={() => setEditValue('cover_image_url', '', { shouldDirty: true })} 
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove Cover
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditingCategory(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editCategoryMutation.isPending || isEditUploading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {editCategoryMutation.isPending ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      ) : (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className={`text-xl font-bold truncate ${isInactive ? 'text-gray-400' : 'text-gray-800'}`}>{category.name}</h2>
            <ToggleSwitch
              checked={!!category.is_active}
              label={category.is_active ? 'Active' : 'Hidden'}
              onChange={() => toggleCategoryMutation.mutate(!category.is_active)}
              disabled={toggleCategoryMutation.isPending}
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={startEditingCategory}
              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Edit category"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete category"
            >
              <Trash2 size={16} />
            </button>
            {allOrgLanguages.length > 0 && (
              <button
                onClick={() => setShowTranslations(v => !v)}
                className={`flex items-center gap-1 text-sm font-medium ml-1 p-1 px-2 rounded-md transition-colors ${
                  activeTabLanguage !== 'all'
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-indigo-600 hover:text-indigo-800 hover:bg-gray-150'
                }`}
                title="Translations"
              >
                <Languages size={16} />
                {activeTabLanguage !== 'all' ? null : showTranslations ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            {isItemLimitReached ? (
              <Link 
                to="/billing"
                className="text-sm font-medium text-amber-600 hover:text-amber-800 flex items-center ml-1"
                title={`Item limit reached (${itemCount}/${limits.items})`}
              >
                <Plus size={16} className="mr-1" />
                Upgrade to Add Item ({itemCount}/{limits.items})
              </Link>
            ) : (
              <button
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center ml-1"
              >
                {isAddingItem ? <X size={16} className="mr-1" /> : <Plus size={16} className="mr-1" />}
                {isAddingItem ? 'Cancel' : 'Add Item'}
              </button>
            )}
          </div>
        </div>
      )}

      {isItemLimitReached && !isEditingCategory && (
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 text-amber-900 text-xs flex justify-between items-center gap-2">
          <span>You have reached the item limit ({itemCount}/{limits.items}) for this category. Upgrade your plan to add more items.</span>
          <Link to="/billing" className="font-bold hover:underline text-amber-700">Upgrade Plan &rarr;</Link>
        </div>
      )}

      {/* Category translations panel */}
      {shouldShowTranslations && allOrgLanguages.length > 0 && !isEditingCategory && (
        <div className="px-6 py-4 bg-amber-50/50 border-b border-amber-100">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3">Category Translations</p>
          <TranslationPanel
            type="category"
            entityId={category.id}
            languages={allOrgLanguages}
            getAccessTokenSilently={getAccessTokenSilently}
            activeTabLanguage={activeTabLanguage}
          />
        </div>
      )}

      {/* Add item form */}
      {isAddingItem && (
        <form onSubmit={handleSubmit(d => createItemMutation.mutate(d))} className="p-6 bg-indigo-50/50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name (English — fallback)</label>
              <input
                {...register('name')}
                placeholder="e.g. Garlic Bread"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="text"
                {...register('price')}
                placeholder="e.g. 10.99 or 10,99"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (English — fallback, optional)</label>
              <input
                {...register('description')}
                placeholder="e.g. Freshly baked..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Image</label>
              <input
                id={`item_image_file_${category.id}`}
                type="file"
                accept="image/*"
                onChange={handleItemImageUpload}
                disabled={isUploading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              {isUploading && <p className="text-sm text-indigo-600 mt-1">Uploading...</p>}
              {watchItemImageUrl && !isUploading && (
                <img src={`${UPLOADS_ORIGIN}${watchItemImageUrl}`} alt="Preview" className="mt-2 h-16 w-16 object-cover rounded" />
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Preferences</label>
              <div className="flex gap-4 items-center h-[42px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('is_vegan')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700">Vegan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('is_gluten_free')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700">Gluten Free</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allergens (comma-separated)</label>
              <input
                {...register('allergens')}
                placeholder="e.g. nuts, dairy, soy"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Calories (kcal)</label>
              <input
                type="number"
                {...register('calories')}
                placeholder="e.g. 250"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Protein (g)</label>
              <input
                type="text"
                {...register('protein')}
                placeholder="e.g. 12"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Carbs (g)</label>
              <input
                type="text"
                {...register('carbohydrates')}
                placeholder="e.g. 35"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Fat (g)</label>
              <input
                type="text"
                {...register('fat')}
                placeholder="e.g. 8"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (Base Language)</label>
            <textarea
              {...register('ingredients')}
              placeholder="e.g. Lentils, water, spices..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createItemMutation.isPending || isUploading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Uploading Image...' : createItemMutation.isPending ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      )}

      {/* Item list */}
      <div className="p-0">
        {isLoading ? (
          <p className="p-6 text-gray-500">Loading items...</p>
        ) : items?.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {items.map((item: any) => (
              <ItemRow
                key={item.id}
                item={item}
                categoryId={category.id}
                allOrgLanguages={allOrgLanguages}
                onToggle={(isAvailable) => toggleItemMutation.mutate({ itemId: item.id, isAvailable })}
                togglePending={toggleItemMutation.isPending}
                getAccessTokenSilently={getAccessTokenSilently}
                activeTabLanguage={activeTabLanguage}
              />
            ))}
          </ul>
        ) : (
          <p className="p-6 text-gray-500 italic text-center">No items in this category.</p>
        )}
      </div>

      {/* Category Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${category.name}"? This will permanently delete this category and all its items.`}
        confirmLabel={deleteCategoryMutation.isPending ? 'Deleting...' : 'Delete'}
        onConfirm={() => deleteCategoryMutation.mutate()}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// ItemRow
// ---------------------------------------------------------------------------

interface ItemRowProps {
  item: any;
  categoryId: string;
  allOrgLanguages: any[];
  onToggle: (isAvailable: boolean) => void;
  togglePending: boolean;
  getAccessTokenSilently: () => Promise<string>;
  activeTabLanguage: string;
}

const ItemRow = ({ item, categoryId, allOrgLanguages, onToggle, togglePending, getAccessTokenSilently, activeTabLanguage }: ItemRowProps) => {
  const queryClient = useQueryClient();
  const [showTranslations, setShowTranslations] = useState(false);
  
  // Item Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Item Delete State
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { register: registerEdit, handleSubmit: handleSubmitEdit, setValue: setEditValue, watch: watchEdit, reset: resetItemEdit, formState: { errors: editErrors } } = useForm<ItemFormInput, unknown, ItemFormOutput>({
    resolver: zodResolver(itemSchema) as any,
    defaultValues: {
      name: item.name,
      description: item.description ?? '',
      price: (Number(item.price) / 100).toString(),
      image_url: item.image_url ?? '',
      is_vegan: !!item.is_vegan,
      is_gluten_free: !!item.is_gluten_free,
      allergens: item.allergens ? (() => { try { return JSON.parse(item.allergens).join(', '); } catch { return ''; } })() : '',
      calories: item.calories ?? '',
      protein: item.protein ?? '',
      carbohydrates: item.carbohydrates ?? '',
      fat: item.fat ?? '',
      ingredients: item.ingredients ?? '',
    }
  });

  const editItemImageUrl = watchEdit('image_url');

  const editItemMutation = useMutation({
    mutationFn: (data: ItemFormOutput) =>
      fetchApi(`/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          price: data.price,
          image_url: data.image_url || null,
          is_vegan: data.is_vegan,
          is_gluten_free: data.is_gluten_free,
          allergens: data.allergens,
          calories: data.calories,
          protein: data.protein,
          carbohydrates: data.carbohydrates,
          fat: data.fat,
          ingredients: data.ingredients,
        }),
      }, getAccessTokenSilently),
    onSuccess: (updated) => {
      queryClient.setQueryData(['items', categoryId], (prev: any[]) =>
        prev?.map(i => i.id === updated.id ? updated : i)
      );
      setIsEditing(false);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: () =>
      fetchApi(`/items/${item.id}`, {
        method: 'DELETE',
      }, getAccessTokenSilently),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', categoryId] });
      setShowDeleteDialog(false);
    },
  });

  const handleEditItemImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const compressedFile = await compressImageToWebP(file);
      const res = await uploadFile(compressedFile, getAccessTokenSilently);
      setEditValue('image_url', res.url, { shouldDirty: true });
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };
  const startEditing = () => {
    resetItemEdit({
      name: item.name,
      description: item.description ?? '',
      price: (Number(item.price) / 100).toFixed(2),
      image_url: item.image_url ?? '',
      is_vegan: !!item.is_vegan,
      is_gluten_free: !!item.is_gluten_free,
      allergens: item.allergens ? (() => { try { return JSON.parse(item.allergens).join(', '); } catch { return ''; } })() : '',
      calories: item.calories ?? '',
      protein: item.protein ?? '',
      carbohydrates: item.carbohydrates ?? '',
      fat: item.fat ?? '',
      ingredients: item.ingredients ?? '',
    });
    setIsEditing(true);
  };
  const unavailable = !item.is_available;

  // Auto-expand translation fields if a specific focus language is selected
  const shouldShowTranslations = showTranslations || activeTabLanguage !== 'all';

  return (
    <li className={`transition-colors ${unavailable ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
      
      {/* Item Display or Inline Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSubmitEdit(d => editItemMutation.mutate(d))} className="p-6 bg-indigo-50/30 border-b border-gray-100 space-y-4">
          <h4 className="text-sm font-bold text-gray-800">Edit Item</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name (English — fallback)</label>
              <input
                {...registerEdit('name')}
                placeholder="Item Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
              {editErrors.name && <p className="mt-1 text-sm text-red-600">{editErrors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="text"
                {...registerEdit('price')}
                placeholder="10.99"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              {editErrors.price && <p className="mt-1 text-sm text-red-600">{editErrors.price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (English — fallback, optional)</label>
              <input
                {...registerEdit('description')}
                placeholder="Description"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleEditItemImageUpload}
                disabled={isUploading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              {isUploading && <p className="text-sm text-indigo-600 mt-1">Uploading...</p>}
              {editItemImageUrl && !isUploading && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={`${UPLOADS_ORIGIN}${editItemImageUrl}`} alt="Preview" className="h-16 w-16 object-cover rounded" />
                  <button 
                    type="button" 
                    onClick={() => setEditValue('image_url', '', { shouldDirty: true })} 
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Preferences</label>
              <div className="flex gap-4 items-center h-[42px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...registerEdit('is_vegan')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700">Vegan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...registerEdit('is_gluten_free')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700">Gluten Free</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allergens (comma-separated)</label>
              <input
                {...registerEdit('allergens')}
                placeholder="e.g. nuts, dairy, soy"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Calories (kcal)</label>
              <input
                type="number"
                {...registerEdit('calories')}
                placeholder="e.g. 250"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Protein (g)</label>
              <input
                type="text"
                {...registerEdit('protein')}
                placeholder="e.g. 12"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Carbs (g)</label>
              <input
                type="text"
                {...registerEdit('carbohydrates')}
                placeholder="e.g. 35"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Fat (g)</label>
              <input
                type="text"
                {...registerEdit('fat')}
                placeholder="e.g. 8"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (Base Language)</label>
            <textarea
              {...registerEdit('ingredients')}
              placeholder="e.g. Lentils, water, spices..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editItemMutation.isPending || isUploading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {editItemMutation.isPending ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      ) : (
        <div className={`p-6 flex justify-between items-center gap-4 ${unavailable ? 'opacity-50' : ''}`}>
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {item.image_url && (
              <img
                src={`${UPLOADS_ORIGIN}${item.image_url}`}
                alt={item.name}
                className={`w-16 h-16 rounded-md object-cover flex-shrink-0 ${unavailable ? 'grayscale' : ''}`}
              />
            )}
            <div className="min-w-0">
              <h3 className={`text-lg font-medium ${unavailable ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {item.name}
              </h3>
              {item.description && (
                <p className="text-gray-500 text-sm mt-1 truncate">{item.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={startEditing}
              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Edit item"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete item"
            >
              <Trash2 size={16} />
            </button>
            {allOrgLanguages.length > 0 && (
              <button
                onClick={() => setShowTranslations(v => !v)}
                className={`transition-colors p-1.5 rounded-md hover:bg-gray-100 ${
                  activeTabLanguage !== 'all'
                    ? 'text-amber-800 bg-amber-100 hover:bg-amber-200'
                    : 'text-indigo-400 hover:text-indigo-600'
                }`}
                title="Translations"
              >
                <Languages size={16} />
              </button>
            )}
            <div className={`text-lg font-semibold ${unavailable ? 'text-gray-400' : 'text-gray-700'} px-2`}>
              ${(Number(item.price) / 100).toFixed(2)}
            </div>
            <ToggleSwitch
              checked={!!item.is_available}
              label={item.is_available ? 'Available' : 'Hidden'}
              onChange={() => onToggle(!item.is_available)}
              disabled={togglePending}
            />
          </div>
        </div>
      )}

      {/* Item translations panel */}
      {shouldShowTranslations && allOrgLanguages.length > 0 && !isEditing && (
        <div className="px-6 pb-5 bg-amber-50/50 border-t border-amber-100">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mt-3 mb-3">Item Translations</p>
          <TranslationPanel
            type="item"
            entityId={item.id}
            languages={allOrgLanguages}
            getAccessTokenSilently={getAccessTokenSilently}
            activeTabLanguage={activeTabLanguage}
          />
        </div>
      )}

      {/* Item Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Item"
        message={`Are you sure you want to delete "${item.name}"?`}
        confirmLabel={deleteItemMutation.isPending ? 'Deleting...' : 'Delete'}
        onConfirm={() => deleteItemMutation.mutate()}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </li>
  );
};
