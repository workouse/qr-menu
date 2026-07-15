
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../api/client';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const venueSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
});

type VenueForm = z.infer<typeof venueSchema>;

export const VenueCreate = () => {
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  const { register, handleSubmit, formState: { errors } } = useForm<VenueForm>({
    resolver: zodResolver(venueSchema)
  });

  const mutation = useMutation({
    mutationFn: (newVenue: VenueForm) => {
      const orgId = localStorage.getItem('active_org_id'); 
      return fetchApi(`/organizations/${orgId}/venues`, {
        method: 'POST',
        body: JSON.stringify(newVenue)
      }, getAccessTokenSilently);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      navigate('/');
    }
  });

  const onSubmit = (data: VenueForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('create_new_venue')}</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('venue_name')}</label>
          <input 
            {...register('name')}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={t('venue_name_placeholder')}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('url_slug')}</label>
          <div className="flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
              qr-menu.com/
            </span>
            <input 
              {...register('slug')}
              className="flex-1 min-w-0 block w-full px-4 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={t('slug_placeholder')}
            />
          </div>
          {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>}
        </div>

        <div className="flex justify-end space-x-3">
          <button 
            type="button" 
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            {t('cancel')}
          </button>
          <button 
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {mutation.isPending ? t('creating') : t('create_venue')}
          </button>
        </div>
      </form>
    </div>
  );
};
