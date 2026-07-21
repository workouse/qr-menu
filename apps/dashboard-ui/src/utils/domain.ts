export const getBaseDomain = (): string => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    if (apiUrl.includes('api.')) {
      const url = new URL(apiUrl);
      return url.host.replace('api.', '');
    }
  } catch (e) {
    console.error('Failed to parse API URL for base domain:', e);
  }
  const host = window.location.host;
  return host.replace(/(dashboard|api)\./, '');
};

export const getVenueUrl = (venue: {
  slug: string;
  custom_domain?: string | null;
  custom_domain_verified?: boolean | number | null;
}): string => {
  if (venue.custom_domain && venue.custom_domain_verified) {
    return `https://${venue.custom_domain}`;
  }
  if (import.meta.env.DEV) {
    return `http://localhost:8788/${venue.slug}`;
  }
  const baseDomain = getBaseDomain();
  const protocol = window.location.protocol;
  return `${protocol}//${baseDomain}/${venue.slug}`;
};
