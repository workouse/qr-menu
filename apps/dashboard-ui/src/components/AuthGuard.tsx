
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';
import { AuthLayout } from '../layouts/AuthLayout';

export const AuthGuard = ({ component }: { component: React.ComponentType<any> }) => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (!isAuthenticated && !isLoading) {
    return <AuthLayout />;
  }

  const Component = withAuthenticationRequired(component, {
    onRedirecting: () => (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    ),
  });

  return <Component />;
};
