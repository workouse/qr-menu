import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../api/client';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Menu as MenuIcon, Grid, Utensils, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Overview = () => {
  const { t } = useTranslation();
  const { getAccessTokenSilently } = useAuth0();
  
  const { data: venues, isLoading: venuesLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => fetchApi('/venues', {}, getAccessTokenSilently)
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => fetchApi('/stats', {}, getAccessTokenSilently)
  });

  const isLoading = venuesLoading || statsLoading;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard_overview')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('welcome_to_qr_menu')}</p>
        </div>
        <Link 
          to="/venues/new" 
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-750 transition-colors font-medium text-sm shadow-sm hover:shadow"
        >
          <Plus size={18} className="mr-2" />
          {t('new_venue')}
        </Link>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Venues Stat */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center hover:shadow-md hover:scale-[1.02] transition-all duration-300 group">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('total_venues')}</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{isLoading ? '-' : stats?.venues ?? venues?.length ?? 0}</p>
          </div>
        </div>

        {/* Menus Stat */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center hover:shadow-md hover:scale-[1.02] transition-all duration-300 group">
          <div className="p-3 rounded-xl bg-violet-50 text-violet-600 mr-4 group-hover:bg-violet-600 group-hover:text-white transition-colors duration-300">
            <MenuIcon size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('total_menus')}</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{isLoading ? '-' : stats?.menus ?? 0}</p>
          </div>
        </div>

        {/* Categories Stat */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center hover:shadow-md hover:scale-[1.02] transition-all duration-300 group">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 mr-4 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
            <Grid size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('total_categories')}</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{isLoading ? '-' : stats?.categories ?? 0}</p>
          </div>
        </div>

        {/* Items Stat */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center hover:shadow-md hover:scale-[1.02] transition-all duration-300 group">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 mr-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
            <Utensils size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('total_items')}</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{isLoading ? '-' : stats?.items ?? 0}</p>
          </div>
        </div>

        {/* Plan Stat */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center hover:shadow-md hover:scale-[1.02] transition-all duration-300 group col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 mr-4 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
            <CreditCard size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">{t('subscribed_plan')}</p>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-750 mt-1 uppercase tracking-wide">
              {isLoading ? '-' : t(stats?.plan?.toLowerCase() || 'free')}
            </span>
          </div>
        </div>
      </div>
      
      {/* Recent Venues List */}
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

