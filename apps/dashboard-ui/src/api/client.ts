export const API_BASE = import.meta.env.VITE_API_URL as string;

// Derives the upload origin from the API URL (strips /api suffix)
export const UPLOADS_ORIGIN = API_BASE.replace(/\/api$/, '');

export const fetchApi = async (
  endpoint: string,
  options: RequestInit = {},
  getAccessTokenSilently?: () => Promise<string>
) => {
  let token = '';

  if (getAccessTokenSilently) {
    try {
      token = await getAccessTokenSilently();
    } catch (e) {
      console.warn('Failed to get Auth0 token', e);
    }
  }

  const orgId = localStorage.getItem('active_org_id');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(orgId ? { 'x-org-id': orgId } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.error && parsed.error.toLowerCase().includes('tier limit exceeded')) {
        window.dispatchEvent(
          new CustomEvent('api-toast-error', {
            detail: {
              message: parsed.error,
              type: 'tier_limit',
            },
          })
        );
      }
    } catch (e) {}
    throw new Error(`API Error: ${response.status} - ${errorBody}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

export const uploadFile = async (
  file: File,
  getAccessTokenSilently?: () => Promise<string>
) => {
  let token = '';
  if (getAccessTokenSilently) {
    try {
      token = await getAccessTokenSilently();
    } catch (e) {
      console.warn('Failed to get Auth0 token', e);
    }
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/uploads`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Upload Error: ${response.status} - ${errorBody}`);
  }

  return response.json();
};
