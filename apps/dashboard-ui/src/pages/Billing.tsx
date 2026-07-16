import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth0 } from '@auth0/auth0-react';
import { fetchApi } from '../api/client';
import { Check, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import React from 'react';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-4 bg-red-50 text-red-500"><h1 className="font-bold">Something went wrong.</h1><pre>{this.state.error?.toString()}</pre></div>;
    }
    return this.props.children;
  }
}

export const Billing = () => {
  const { getAccessTokenSilently } = useAuth0();
  const { t } = useTranslation();
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => fetchApi('/organizations', {}, getAccessTokenSilently),
  });
  const activeOrgId = localStorage.getItem('active_org_id') || orgs?.[0]?.id;

  const { data: org, isLoading } = useQuery({
    queryKey: ['organizations', activeOrgId],
    queryFn: () => fetchApi(`/organizations/${activeOrgId}`, {}, getAccessTokenSilently),
    enabled: !!activeOrgId,
  });

  const handleUpgrade = async (tier: 'Standard' | 'Business') => {
    try {
      setLoadingCheckout(tier);
      const res = await fetchApi(`/organizations/${activeOrgId}/billing/checkout`, {
        method: 'POST',
        body: JSON.stringify({ tier })
      }, getAccessTokenSilently);
      
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error('Failed to create checkout', err);
    } finally {
      setLoadingCheckout(null);
    }
  };

  const handleManagePortal = async () => {
    try {
      setLoadingPortal(true);
      const res = await fetchApi(`/organizations/${activeOrgId}/billing/portal`, {
        method: 'POST'
      }, getAccessTokenSilently);
      
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error('Failed to get portal link', err);
    } finally {
      setLoadingPortal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const subscription = org?.subscription;
  const currentTier = subscription?.status === 'active' ? subscription.tier : 'Free';

  return (
    <ErrorBoundary>
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('billing_and_subscription', 'Billing & Subscription')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('billing_desc', "Manage your organization's plan and billing details.")}
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">{t('current_plan', 'Current Plan')}</h2>
              <div className="mt-2 flex items-center space-x-3">
                <span className="text-3xl font-extrabold text-indigo-600">{currentTier}</span>
                {subscription?.status === 'active' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                )}
              </div>
            </div>
            
            {subscription?.status === 'active' && (
              <button
                onClick={handleManagePortal}
                disabled={loadingPortal}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {loadingPortal ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                {t('manage_subscription', 'Manage Subscription')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 max-w-sm mx-auto">
        <span className={`text-sm font-semibold ${billingPeriod === 'monthly' ? 'text-indigo-600' : 'text-gray-500'}`}>Monthly</span>
        <button
          onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annually' : 'monthly')}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${billingPeriod === 'annually' ? 'bg-indigo-600' : 'bg-gray-200'}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${billingPeriod === 'annually' ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
        <span className={`text-sm font-semibold flex items-center gap-1.5 ${billingPeriod === 'annually' ? 'text-indigo-600' : 'text-gray-500'}`}>
          Annually
          <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Save 15%+</span>
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div className={`bg-white rounded-xl shadow-sm border ${currentTier === 'Free' ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-50' : 'border-gray-200'} p-6 flex flex-col`}>
          <h3 className="text-lg font-semibold text-gray-900">Free</h3>
          <p className="mt-2 text-sm text-gray-500 flex-1">Perfect for trying out the platform.</p>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-gray-900">$0</span>
            <span className="text-base font-medium text-gray-500">/mo</span>
          </div>
          <ul className="mt-6 space-y-4">
            <li className="flex space-x-3"><Check className="flex-shrink-0 h-5 w-5 text-green-500" /><span className="text-sm text-gray-500">1 Venue</span></li>
            <li className="flex space-x-3"><Check className="flex-shrink-0 h-5 w-5 text-green-500" /><span className="text-sm text-gray-500">1 Menu</span></li>
            <li className="flex space-x-3"><Check className="flex-shrink-0 h-5 w-5 text-green-500" /><span className="text-sm text-gray-500">2 Categories</span></li>
            <li className="flex space-x-3"><Check className="flex-shrink-0 h-5 w-5 text-green-500" /><span className="text-sm text-gray-500">10 Items</span></li>
          </ul>
          <div className="mt-8">
            <button
              disabled={true}
              className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${currentTier === 'Free' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}
            >
              {currentTier === 'Free' ? 'Current Plan' : 'Select'}
            </button>
          </div>
        </div>

        {/* Standard Plan */}
        <div className={`bg-white rounded-xl shadow-sm border ${currentTier === 'Standard' ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-50' : 'border-gray-200'} p-6 flex flex-col relative`}>
          {currentTier === 'Standard' && (
            <div className="absolute top-0 right-0 -mr-1 -mt-1 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900">Standard</h3>
          <p className="mt-2 text-sm text-gray-500 flex-1">Great for small businesses.</p>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-gray-900">
              {billingPeriod === 'monthly' ? '$7' : '$70'}
            </span>
            <span className="text-base font-medium text-gray-500">
              {billingPeriod === 'monthly' ? '/mo' : '/yr'}
            </span>
          </div>
          <ul className="mt-6 space-y-4">
            <li className="flex space-x-3"><Check className="flex-shrink-0 h-5 w-5 text-green-500" /><span className="text-sm text-gray-500">5 Venues</span></li>
            <li className="flex space-x-3"><Check className="flex-shrink-0 h-5 w-5 text-green-500" /><span className="text-sm text-gray-500">2 Menus per Venue</span></li>
            <li className="flex space-x-3"><Check className="flex-shrink-0 h-5 w-5 text-green-500" /><span className="text-sm text-gray-500">30 Categories</span></li>
            <li className="flex space-x-3"><Check className="flex-shrink-0 h-5 w-5 text-green-500" /><span className="text-sm text-gray-500">20 Items per Category</span></li>
          </ul>
          <div className="mt-8">
            <button
              onClick={() => handleUpgrade('Standard')}
              disabled={currentTier === 'Standard' || loadingCheckout !== null}
              className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${currentTier === 'Standard' ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loadingCheckout === 'Standard' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : currentTier === 'Standard' ? (
                'Current Plan'
              ) : (
                'Upgrade to Standard'
              )}
            </button>
          </div>
        </div>

        {/* Business Plan */}
        <div className={`bg-white rounded-xl shadow-sm border ${currentTier === 'Business' ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-50' : 'border-gray-200'} p-6 flex flex-col relative`}>
          {currentTier === 'Business' && (
            <div className="absolute top-0 right-0 -mr-1 -mt-1 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900">Business</h3>
          <p className="mt-2 text-sm text-gray-500 flex-1">For growing multi-location brands.</p>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-gray-900">
              {billingPeriod === 'monthly' ? '$15' : '$150'}
            </span>
            <span className="text-base font-medium text-gray-500">
              {billingPeriod === 'monthly' ? '/mo' : '/yr'}
            </span>
          </div>
          <ul className="mt-6 space-y-4">
            <li className="flex space-x-3"><Check className="flex-shrink-0 h-5 w-5 text-green-500" /><span className="text-sm text-gray-500">5 Venues</span></li>
            <li className="flex space-x-3"><Check className="flex-shrink-0 h-5 w-5 text-green-500" /><span className="text-sm text-gray-500">5 Menus per Venue</span></li>
            <li className="flex space-x-3"><Check className="flex-shrink-0 h-5 w-5 text-green-500" /><span className="text-sm text-gray-500">30 Categories</span></li>
            <li className="flex space-x-3"><Check className="flex-shrink-0 h-5 w-5 text-green-500" /><span className="text-sm text-gray-500">50 Items per Category</span></li>
          </ul>
          <div className="mt-8">
            <button
              onClick={() => handleUpgrade('Business')}
              disabled={currentTier === 'Business' || loadingCheckout !== null}
              className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${currentTier === 'Business' ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loadingCheckout === 'Business' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : currentTier === 'Business' ? (
                'Current Plan'
              ) : (
                'Upgrade to Business'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
};
