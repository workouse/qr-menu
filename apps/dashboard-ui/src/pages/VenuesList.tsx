
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../api/client';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTierLimits } from '../hooks/useTierLimits';

export const VenuesList = () => {
  const { getAccessTokenSilently } = useAuth0();
  const { t } = useTranslation();
  const { data: venues, isLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => fetchApi('/venues', {}, getAccessTokenSilently)
  });

  const { limits, checkVenueLimit, tier } = useTierLimits();
  const venueCount = venues?.length || 0;
  const isLimitReached = !checkVenueLimit(venueCount);

  return (
    <div>
      {isLimitReached && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <p className="font-bold">You've reached your venue limit</p>
            <p className="text-xs opacity-90">Your current plan ({tier}) allows up to {limits.venues} {limits.venues === 1 ? 'venue' : 'venues'}. Upgrade your plan to manage more locations.</p>
          </div>
          <Link to="/billing" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
            Upgrade Now
          </Link>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('all_venues')}</h1>
        {isLimitReached ? (
          <Link 
            to="/billing" 
            className="flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold transition-colors shadow-sm"
          >
            <Plus size={18} className="mr-2" />
            Upgrade to Add Venue ({venueCount}/{limits.venues})
          </Link>
        ) : (
          <Link 
            to="/venues/new" 
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            {t('new_venue')}
          </Link>
        )}
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
