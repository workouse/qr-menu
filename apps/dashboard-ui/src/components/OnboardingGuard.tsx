import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { useAuth0 } from '@auth0/auth0-react';

export const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: userProfile, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: () => fetchApi('/me', {}, getAccessTokenSilently),
    retry: false
  });

  useEffect(() => {
    if (!isLoading && !isError && userProfile) {
      if (userProfile.needs_onboarding && location.pathname !== '/onboarding') {
        navigate('/onboarding');
      } else if (!userProfile.needs_onboarding) {
        // Save to local storage for API client injection
        const currentOrg = localStorage.getItem('active_org_id');
        if (!currentOrg && userProfile.org_id) {
          localStorage.setItem('active_org_id', userProfile.org_id);
        }
        
        // If they are on onboarding page but already have an org, redirect to home
        if (location.pathname === '/onboarding') {
          navigate('/');
        }
      }
    }
  }, [userProfile, isLoading, isError, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
};
