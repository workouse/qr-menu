import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../api/client';
import { Menu, X, LayoutDashboard, MapPin, Settings, LogOut, ChevronDown, Globe, BookOpen, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const { logout, user, getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => fetchApi('/organizations', {}, getAccessTokenSilently),
  });

  const activeOrgId = localStorage.getItem('active_org_id');
  const activeOrg = orgs?.find((o: any) => o.id === activeOrgId) || orgs?.[0];

  const handleOrgChange = (orgId: string) => {
    localStorage.setItem('active_org_id', orgId);
    setDropdownOpen(false);
    queryClient.invalidateQueries(); // Refresh everything contextually
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-indigo-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-indigo-950">
          <span className="text-xl font-bold tracking-wider">QR MENU</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-indigo-200 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <nav className="p-4 space-y-2 mt-4">
          <Link to="/" className="flex items-center px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
            <LayoutDashboard size={20} className="mr-3" />
            {t('overview')}
          </Link>
          <Link to="/venues" className="flex items-center px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
            <MapPin size={20} className="mr-3" />
            {t('venues')}
          </Link>
          <Link to="/settings" className="flex items-center px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
            <Settings size={20} className="mr-3" />
            {t('settings')}
          </Link>
          <Link to="/billing" className="flex items-center px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
            <CreditCard size={20} className="mr-3" />
            {t('billing', 'Billing & Subscription')}
          </Link>
          <a href="https://docs.qr-menu.workouse.com" target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
            <BookOpen size={20} className="mr-3" />
            {t('documentation', 'Documentation')}
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 focus:outline-none lg:hidden">
            <Menu size={24} />
          </button>
          
          <div className="flex items-center justify-end w-full">
            <div className="flex items-center space-x-6">
              
              {/* Org Switcher */}
              <div className="relative">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  <span className="truncate max-w-[150px]">{activeOrg?.name || 'Loading...'}</span>
                  <ChevronDown size={16} />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50 border border-gray-100">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t('switch_organization')}
                    </div>
                    {orgs?.map((org: any) => (
                      <button
                        key={org.id}
                        onClick={() => handleOrgChange(org.id)}
                        className={`w-full text-left px-4 py-2 text-sm ${org.id === activeOrgId ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {org.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-6 w-px bg-gray-200"></div>

              {/* Language Switcher */}
              <div className="relative">
                <button 
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  <Globe size={18} />
                  <span className="uppercase">{i18n.language}</span>
                  <ChevronDown size={14} />
                </button>
                {langDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50 border border-gray-100">
                    <button
                      onClick={() => { i18n.changeLanguage('en'); setLangDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm ${i18n.language === 'en' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {t('english')}
                    </button>
                    <button
                      onClick={() => { i18n.changeLanguage('tr'); setLangDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm ${i18n.language === 'tr' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {t('turkish')}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                <button 
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600 transition-colors"
                  title={t('logout')}
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main section */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
