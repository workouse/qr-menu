
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../api/client';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import { MapPin, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Overview = () => {
  const { t } = useTranslation();
  const { getAccessTokenSilently } = useAuth0();
  const { data: venues, isLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => fetchApi('/venues', {}, getAccessTokenSilently)
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard_overview')}</h1>
        <Link 
          to="/venues/new" 
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          {t('new_venue')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{t('total_venues')}</p>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '-' : venues?.length || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">{t('your_recent_venues')}</h2>
        </div>
        <div className="p-6">
          {isLoading ? (
            <p className="text-gray-500 text-sm">{t('loading_venues')}</p>
          ) : venues?.length > 0 ? (
            <ul className="space-y-3">
              {venues.slice(0, 5).map((venue: any) => (
                <li key={venue.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors">
                  <span className="font-medium text-gray-900">{venue.name}</span>
                  <Link to={`/venues/${venue.id}/menus`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    {t('manage_menus')} &rarr;
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">{t('no_venues_yet')}</p>
              <Link to="/venues/new" className="text-indigo-600 font-medium hover:underline">{t('create_first_venue')}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
