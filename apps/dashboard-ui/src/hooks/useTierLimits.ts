import { useQuery } from '@tanstack/react-query';
import { useAuth0 } from '@auth0/auth0-react';
import { fetchApi } from '../api/client';

export const TIER_LIMITS = {
  Free: { venues: 1, menus: 1, categories: 2, items: 10, languages: 1, organizations: 1, customDomain: false },
  Standard: { venues: 5, menus: 2, categories: 30, items: 20, languages: 3, organizations: 2, customDomain: true },
  Business: { venues: 5, menus: 5, categories: 30, items: 50, languages: 10, organizations: 5, customDomain: true },
  Enterprise: { venues: Infinity, menus: Infinity, categories: Infinity, items: Infinity, languages: Infinity, organizations: Infinity, customDomain: true }
} as const;

export type TierName = keyof typeof TIER_LIMITS;

export const useTierLimits = () => {
  const { getAccessTokenSilently } = useAuth0();

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => fetchApi('/organizations', {}, getAccessTokenSilently),
  });

  const activeOrgId = localStorage.getItem('active_org_id') || orgs?.[0]?.id;

  const { data: org } = useQuery({
    queryKey: ['organizations', activeOrgId],
    queryFn: () => fetchApi(`/organizations/${activeOrgId}`, {}, getAccessTokenSilently),
    enabled: !!activeOrgId,
  });

  const subscription = org?.subscription;
  const currentTier: TierName = (subscription?.status === 'active' || subscription?.status === 'on_trial') 
    ? (subscription.tier as TierName || 'Free') 
    : 'Free';

  const limits = TIER_LIMITS[currentTier] || TIER_LIMITS.Free;

  const checkVenueLimit = (currentCount: number) => {
    return currentCount < limits.venues;
  };

  const checkMenuLimit = (currentCount: number) => {
    return currentCount < limits.menus;
  };

  const checkCategoryLimit = (currentCount: number) => {
    return currentCount < limits.categories;
  };

  const checkItemLimit = (currentCount: number) => {
    return currentCount < limits.items;
  };

  const checkLanguageLimit = (currentCount: number) => {
    return currentCount < limits.languages;
  };

  const checkOrganizationLimit = (currentCount: number) => {
    return currentCount < limits.organizations;
  };

  const isCustomDomainAllowed = () => {
    return limits.customDomain;
  };

  return {
    tier: currentTier,
    limits,
    checkVenueLimit,
    checkMenuLimit,
    checkCategoryLimit,
    checkItemLimit,
    checkLanguageLimit,
    checkOrganizationLimit,
    isCustomDomainAllowed,
    isLoaded: !!org,
  };
};
