
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthGuard } from './components/AuthGuard';
import { OnboardingGuard } from './components/OnboardingGuard';
import { Onboarding } from './pages/Onboarding';

import { Overview } from './pages/Overview';
import { VenuesList } from './pages/VenuesList';
import { VenueCreate } from './pages/VenueCreate';
import { MenusList } from './pages/MenusList';
import { MenuBuilder } from './pages/MenuBuilder';
import { Settings } from './pages/Settings';
import { VenueSettings } from './pages/VenueSettings';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('lang')) {
      url.searchParams.delete('lang');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);
  return (
    <Routes>
      <Route path="/onboarding" element={<AuthGuard component={Onboarding} />} />
      <Route path="/" element={<AuthGuard component={() => <OnboardingGuard><DashboardLayout /></OnboardingGuard>} />}>
        <Route path="/" element={<Overview />} />
        <Route path="/venues" element={<VenuesList />} />
        <Route path="/venues/new" element={<VenueCreate />} />
        <Route path="/venues/:id/menus" element={<MenusList />} />
        <Route path="/venues/:id/settings" element={<VenueSettings />} />
        <Route path="/menus/:id/builder" element={<MenuBuilder />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
