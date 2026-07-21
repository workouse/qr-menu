import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../api/client';
import { useAuth0 } from '@auth0/auth0-react';
import { Plus, Play, CheckCircle, X, Pencil, Trash2, Palette, QrCode } from 'lucide-react';
import { QrCodeModal } from '../components/QrCodeModal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { useTierLimits } from '../hooks/useTierLimits';

const menuSchema = z.object({
  name: z.string().min(2, 'Menu name must be at least 2 characters'),
});
type MenuForm = z.infer<typeof menuSchema>;

export const MenusList = () => {
  const { getAccessTokenSilently } = useAuth0();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileSuccess, setCompileSuccess] = useState('');
  const [isAddingMenu, setIsAddingMenu] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editMenuName, setEditMenuName] = useState('');
  const { t } = useTranslation();
  
  // State for deletion dialog
  const [deletingMenu, setDeletingMenu] = useState<any | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MenuForm>({
    resolver: zodResolver(menuSchema)
  });

  const { data: menus, isLoading } = useQuery({
    queryKey: ['menus', id],
    queryFn: () => fetchApi(`/venues/${id}/menus`, {}, getAccessTokenSilently)
  });

  const { limits, checkMenuLimit, tier } = useTierLimits();
  const menuCount = menus?.length || 0;
  const isLimitReached = !checkMenuLimit(menuCount);

  const { data: venue } = useQuery({
    queryKey: ['venue', id],
    queryFn: () => fetchApi(`/venues/${id}`, {}, getAccessTokenSilently),
    enabled: !!id
  });

  const createMenuMutation = useMutation({
    mutationFn: (name: string) => fetchApi(`/venues/${id}/menus`, {
      method: 'POST',
      body: JSON.stringify({ name, is_active: true })
    }, getAccessTokenSilently),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus', id] });
      setIsAddingMenu(false);
      reset();
    }
  });

  const editMenuMutation = useMutation({
    mutationFn: ({ menuId, name }: { menuId: string; name: string }) =>
      fetchApi(`/menus/${menuId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }, getAccessTokenSilently),
    onSuccess: (updated) => {
      queryClient.setQueryData(['menus', id], (prev: any[]) =>
        prev?.map((m) => (m.id === updated.id ? updated : m))
      );
      setEditingMenuId(null);
      setEditMenuName('');
    },
    onError: (err: any) => {
      alert(`${t('failed_update_menu')}${err.message}`);
    }
  });

  const deleteMenuMutation = useMutation({
    mutationFn: (menuId: string) =>
      fetchApi(`/menus/${menuId}`, {
        method: 'DELETE',
      }, getAccessTokenSilently),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus', id] });
      setDeletingMenu(null);
    },
    onError: (err: any) => {
      alert(`${t('failed_delete_menu')}${err.message}`);
      setDeletingMenu(null);
    }
  });

  const onSubmit = (data: MenuForm) => {
    createMenuMutation.mutate(data.name);
  };

  const toggleMenuMutation = useMutation({
    mutationFn: ({ menuId, isActive }: { menuId: string; isActive: boolean }) =>
      fetchApi(`/menus/${menuId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
      }, getAccessTokenSilently),
    onSuccess: (updated) => {
      queryClient.setQueryData(['menus', id], (prev: any[]) =>
        prev?.map((m) => (m.id === updated.id ? updated : m))
      );
    },
  });

  const handleCompile = async () => {
    setIsCompiling(true);
    setCompileSuccess('');
    try {
      await fetchApi(`/venues/${id}/compile`, { method: 'POST' }, getAccessTokenSilently);
      setCompileSuccess(t('menu_compiled_success'));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsCompiling(false);
    }
  };

  const startEditing = (menu: any) => {
    setEditingMenuId(menu.id);
    setEditMenuName(menu.name);
  };

  const cancelEditing = () => {
    setEditingMenuId(null);
    setEditMenuName('');
  };

  const handleSaveEdit = (menuId: string) => {
    if (editMenuName.trim().length < 2) {
      alert(t('menu_name_min_length'));
      return;
    }
    editMenuMutation.mutate({ menuId, name: editMenuName.trim() });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('manage_menus')}</h1>
        <div className="space-x-3 flex items-center">
          <Link 
            to={`/venues/${id}/settings`}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm cursor-pointer"
          >
            <Palette size={18} className="mr-2 text-gray-500" />
            {t('customize_venue')}
          </Link>
          <button 
            onClick={() => setIsQrModalOpen(true)}
            disabled={!venue?.slug}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm cursor-pointer disabled:opacity-50"
          >
            <QrCode size={18} className="mr-2 text-gray-500" />
            {t('generate_qr')}
          </button>
          <button 
            onClick={handleCompile}
            disabled={isCompiling}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Play size={18} className="mr-2" />
            {isCompiling ? t('compiling') : t('publish_to_edge')}
          </button>
          {isLimitReached ? (
            <Link 
              to="/billing"
              className="flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors font-medium text-sm shadow-sm cursor-pointer"
            >
              <Plus size={18} className="mr-2" />
              {t('upgrade_to_add_menu', { count: menuCount, limit: limits.menus })}
            </Link>
          ) : (
            <button 
              onClick={() => setIsAddingMenu(!isAddingMenu)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              {isAddingMenu ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
              {isAddingMenu ? t('cancel') : t('new_menu')}
            </button>
          )}
        </div>
      </div>

      {isLimitReached && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <p className="font-bold">{t('limit_reached_menu_title')}</p>
            <p className="text-xs opacity-90">
              {t('limit_reached_menu_desc', {
                tier,
                limit: limits.menus,
                unit: limits.menus === 1 ? t('unit_menu_singular') : t('unit_menu_plural')
              })}
            </p>
          </div>
          <Link to="/billing" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
            {t('upgrade_now')}
          </Link>
        </div>
      )}

      {isAddingMenu && (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('menu_name')}</label>
            <input 
              {...register('name')}
              placeholder={t('menu_name_placeholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              autoFocus
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <button 
            type="submit"
            disabled={createMenuMutation.isPending}
            className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {createMenuMutation.isPending ? t('creating') : t('create_menu')}
          </button>
        </form>
      )}

      {compileSuccess && (
        <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-lg flex items-center border border-green-200">
          <CheckCircle className="mr-2" size={20} />
          {compileSuccess}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          {isLoading ? (
            <p className="text-gray-500">{t('loading_menus')}</p>
          ) : menus?.length > 0 ? (
            <ul className="space-y-4">
              {menus.map((menu: any) => {
                const isEditing = editingMenuId === menu.id;
                return (
                  <li key={menu.id} className="flex flex-col md:flex-row justify-between md:items-center p-5 bg-gray-50 rounded-lg border border-gray-100 gap-4">
                    {isEditing ? (
                      <div className="flex-1 flex gap-2 w-full items-center">
                        <input
                          type="text"
                          value={editMenuName}
                          onChange={(e) => setEditMenuName(e.target.value)}
                          className="flex-grow px-3 py-1.5 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(menu.id)}
                          disabled={editMenuMutation.isPending}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {t('save')}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold text-lg ${menu.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                          {menu.name}
                        </span>
                        <ToggleSwitch
                          checked={!!menu.is_active}
                          label={menu.is_active ? t('active') : t('inactive')}
                          onChange={() => toggleMenuMutation.mutate({ menuId: menu.id, isActive: !menu.is_active })}
                          disabled={toggleMenuMutation.isPending}
                        />
                      </div>
                    )}
                    
                    {!isEditing && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditing(menu)}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition-colors"
                          title={t('rename_menu')}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingMenu(menu)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title={t('delete_menu')}
                        >
                          <Trash2 size={16} />
                        </button>
                        <Link 
                          to={`/menus/${menu.id}/builder`} 
                          className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded hover:bg-indigo-50 transition-colors"
                        >
                          {t('build_menu')}
                        </Link>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">{t('no_menus_found')}</p>
              <button onClick={() => setIsAddingMenu(true)} className="text-indigo-600 font-medium hover:underline">{t('create_menu_to_get_started')}</button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deletingMenu !== null}
        title={t('delete_menu_confirm_title')}
        message={t('delete_menu_confirm_message', { name: deletingMenu?.name })}
        confirmLabel={deleteMenuMutation.isPending ? t('deleting') : t('delete')}
        onConfirm={() => deletingMenu && deleteMenuMutation.mutate(deletingMenu.id)}
        onCancel={() => setDeletingMenu(null)}
      />

      {/* QR Code Dialog */}
      {venue && (
        <QrCodeModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          venueName={venue.name}
          venueSlug={venue.slug}
          customDomain={venue.custom_domain}
          customDomainVerified={venue.custom_domain_verified}
        />
      )}
    </div>
  );
};
