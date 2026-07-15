
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../api/client';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const VenuesList = () => {
  const { getAccessTokenSilently } = useAuth0();
  const { t } = useTranslation();
  const { data: venues, isLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => fetchApi('/venues', {}, getAccessTokenSilently)
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('all_venues')}</h1>
        <Link 
          to="/venues/new" 
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          {t('new_venue')}
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          {isLoading ? (
            <p className="text-gray-500">{t('loading_venues')}</p>
          ) : venues?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue: any) => (
                <div key={venue.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{venue.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">qr-menu.com/{venue.slug}</p>
                  
                  <Link 
                    to={`/venues/${venue.id}/menus`} 
                    className="block w-full text-center px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded hover:bg-indigo-50 font-medium transition-colors"
                  >
                    {t('manage_menus')}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4 text-lg">{t('no_venues_yet')}</p>
              <Link to="/venues/new" className="text-indigo-600 font-medium hover:underline text-lg">{t('create_first_venue')}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
