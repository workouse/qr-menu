import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTierLimits } from '../hooks/useTierLimits';
import { fetchApi, uploadFile } from '../api/client';
import { compressImageToWebP } from '../utils/image-compression';
import { getBaseDomain } from '../utils/domain';
import { useAuth0 } from '@auth0/auth0-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CheckCircle, 
  AlertCircle, 
  Save, 
  ArrowLeft, 
  Upload, 
  Palette, 
  Phone, 
  MapPin, 
  Mail, 
  Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Custom SVG Components for Social and Brand Icons
const InstagramIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const GlobeIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);


// ---------------------------------------------------------------------------
// Predefined Themes List
// ---------------------------------------------------------------------------
const PREDEFINED_THEMES = [
  {
    id: 'classic-indigo',
    name: 'Classic Indigo',
    primary_color: '#4f46e5',
    accent_color: '#312e81',
    background_color: '#f3f4f6',
    theme_font: 'sans',
    layout_style: 'list',
  },
  {
    id: 'emerald-garden',
    name: 'Emerald Garden',
    primary_color: '#059669',
    accent_color: '#064e3b',
    background_color: '#f0fdf4',
    theme_font: 'rounded',
    layout_style: 'cards',
  },
  {
    id: 'amber-autumn',
    name: 'Amber Autumn',
    primary_color: '#d97706',
    accent_color: '#78350f',
    background_color: '#fffbeb',
    theme_font: 'sans',
    layout_style: 'list',
  },
  {
    id: 'rose-sunset',
    name: 'Rose Sunset',
    primary_color: '#db2777',
    accent_color: '#831843',
    background_color: '#fff1f2',
    theme_font: 'modern',
    layout_style: 'cards',
  },
  {
    id: 'dark-charcoal',
    name: 'Dark Charcoal',
    primary_color: '#f9fafb',
    accent_color: '#e5e7eb',
    background_color: '#111827',
    theme_font: 'serif',
    layout_style: 'cards',
  },
  {
    id: 'classic-bordeaux',
    name: 'Classic Bordeaux',
    primary_color: '#991b1b',
    accent_color: '#450a0a',
    background_color: '#fafaf9',
    theme_font: 'serif',
    layout_style: 'list',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    primary_color: '#0284c7',
    accent_color: '#0c4a6e',
    background_color: '#f0f9ff',
    theme_font: 'rounded',
    layout_style: 'cards',
  },
  {
    id: 'coffee-house',
    name: 'Coffee House',
    primary_color: '#78350f',
    accent_color: '#451a03',
    background_color: '#faf8f6',
    theme_font: 'modern',
    layout_style: 'list',
  },
  {
    id: 'minimal-monochrome',
    name: 'Minimal Monochrome',
    primary_color: '#18181b',
    accent_color: '#3f3f46',
    background_color: '#fafafa',
    theme_font: 'sans',
    layout_style: 'list',
  },
  {
    id: 'forest-moss',
    name: 'Forest Moss',
    primary_color: '#15803d',
    accent_color: '#14532d',
    background_color: '#f7fee7',
    theme_font: 'rounded',
    layout_style: 'cards',
  },
];

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const venueSchema = z.object({
  name: z.string().min(2, 'Venue name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  logo_url: z.string().nullable().optional(),
  website: z.string().url('Must be a valid URL').or(z.literal('')).nullable().optional(),
  facebook: z.string().url('Must be a valid URL').or(z.literal('')).nullable().optional(),
  instagram: z.string().url('Must be a valid URL').or(z.literal('')).nullable().optional(),
  twitter: z.string().url('Must be a valid URL').or(z.literal('')).nullable().optional(),
  phone: z.string().or(z.literal('')).nullable().optional(),
  address: z.string().or(z.literal('')).nullable().optional(),
  email: z.string().email('Must be a valid email').or(z.literal('')).nullable().optional(),
  theme_id: z.string(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color (e.g. #FFFFFF)'),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color (e.g. #FFFFFF)'),
  background_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color (e.g. #FFFFFF)'),
  theme_font: z.string(),
  layout_style: z.string(),
  country_code: z.string().min(2, 'Country must be selected').max(3),
  custom_domain: z.string().or(z.literal('')).nullable().optional(),
  layout_template: z.string().nullable().optional(),
  theme_config: z.string().nullable().optional(),
});
type VenueForm = z.infer<typeof venueSchema>;

export const VenueSettings = () => {
  const { id } = useParams<{ id: string }>();
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'contact' | 'domain'>('branding');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [themeConfig, setThemeConfig] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [activeBuilderSection, setActiveBuilderSection] = useState<'global' | 'header' | 'nav' | 'items' | 'footer'>('global');

  const { t } = useTranslation();
  const { isCustomDomainAllowed } = useTierLimits();
  const domainAllowed = isCustomDomainAllowed();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isDirty } } = useForm<VenueForm>({
    resolver: zodResolver(venueSchema),
  });

  const watchThemeId = watch('theme_id');
  const watchLogoUrl = watch('logo_url');
  const watchName = watch('name');

  const { data: venue, isLoading } = useQuery({
    queryKey: ['venue', id],
    queryFn: () => fetchApi(`/venues/${id}`, {}, getAccessTokenSilently),
    enabled: !!id,
  });

  useEffect(() => {
    if (venue) {
      reset({
        name: venue.name ?? '',
        slug: venue.slug ?? '',
        logo_url: venue.logo_url ?? '',
        website: venue.website ?? '',
        facebook: venue.facebook ?? '',
        instagram: venue.instagram ?? '',
        twitter: venue.twitter ?? '',
        phone: venue.phone ?? '',
        address: venue.address ?? '',
        email: venue.email ?? '',
        theme_id: venue.theme_id ?? 'classic-indigo',
        primary_color: venue.primary_color ?? '#4f46e5',
        accent_color: venue.accent_color ?? '#312e81',
        background_color: venue.background_color ?? '#f3f4f6',
        theme_font: venue.theme_font ?? 'sans',
        layout_style: venue.layout_style ?? 'list',
        country_code: venue.country_code ?? 'TR',
        custom_domain: venue.custom_domain ?? '',
        layout_template: venue.layout_template ?? 'default',
        theme_config: venue.theme_config ?? '',
      });
      setIsAdvancedMode(venue.theme_id === 'custom');

      let parsedConfig: any = null;
      if (venue.theme_config) {
        try {
          parsedConfig = JSON.parse(venue.theme_config);
        } catch (e) {
          console.error('Failed to parse theme_config, falling back to legacy values', e);
        }
      }

      if (!parsedConfig) {
        parsedConfig = {
          global: {
            primary_color: venue.primary_color ?? '#4f46e5',
            accent_color: venue.accent_color ?? '#312e81',
            background_color: venue.background_color ?? '#f3f4f6',
            background_texture: 'none',
            font_family: venue.theme_font === 'serif' ? 'Playfair Display' : venue.theme_font === 'rounded' ? 'Outfit' : venue.theme_font === 'modern' ? 'Poppins' : 'Inter',
            custom_css: ''
          },
          sections: {
            header: {
              layout: 'centered',
              show_logo: true,
              show_banner: false,
              circular_text: ''
            },
            category_nav: {
              style: 'sticky-tabs',
              show_category_images: true
            },
            item_list: {
              layout_style: venue.layout_style ?? 'list',
              desktop_columns: venue.layout_style === 'cards' ? 2 : 1,
              show_item_images: true,
              show_calories: true,
              show_allergens: true
            },
            footer: {
              show_socials: true,
              show_contact: true,
              footer_style: 'classic'
            }
          }
        };
      }
      setThemeConfig(parsedConfig);
    }
  }, [venue, reset]);

  const verifyDomainMutation = useMutation({
    mutationFn: () =>
      fetchApi(`/venues/${id}/verify-domain`, {
        method: 'POST',
      }, getAccessTokenSilently),
    onSuccess: (data: any) => {
      if (data.verified) {
        queryClient.invalidateQueries({ queryKey: ['venue', id] });
        setFeedback({ type: 'success', message: t('domain_verified_success') });
      } else {
        setFeedback({ type: 'error', message: data.error || t('domain_verification_failed') });
      }
      setTimeout(() => setFeedback(null), 5000);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message || t('domain_verification_request_failed') });
      setTimeout(() => setFeedback(null), 5000);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: VenueForm) =>
      fetchApi(`/venues/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }, getAccessTokenSilently),
    onSuccess: (updated) => {
      queryClient.setQueryData(['venue', id], updated);
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      reset(updated);
      setFeedback({ type: 'success', message: t('venue_customization_saved') });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message ?? t('failed_save_venue') });
    },
  });

  const updateConfigField = (section: 'global' | 'header' | 'category_nav' | 'item_list' | 'footer', updates: any) => {
    if (!themeConfig) return;
    const newConfig = { ...themeConfig };
    if (section === 'global') {
      newConfig.global = { ...newConfig.global, ...updates };
      if (updates.primary_color) setValue('primary_color', updates.primary_color, { shouldDirty: true });
      if (updates.accent_color) setValue('accent_color', updates.accent_color, { shouldDirty: true });
      if (updates.background_color) setValue('background_color', updates.background_color, { shouldDirty: true });
      if (updates.font_family !== undefined) {
        const fontVal = updates.font_family === 'Playfair Display' ? 'serif' : updates.font_family === 'Outfit' ? 'rounded' : updates.font_family === 'Poppins' ? 'modern' : 'sans';
        setValue('theme_font', fontVal, { shouldDirty: true });
      }
    } else {
      newConfig.sections = {
        ...newConfig.sections,
        [section]: { ...newConfig.sections[section], ...updates }
      };
      if (section === 'item_list' && updates.layout_style) {
        setValue('layout_style', updates.layout_style, { shouldDirty: true });
      }
    }
    setThemeConfig(newConfig);
    setValue('theme_config', JSON.stringify(newConfig), { shouldDirty: true });
  };

  const handleSelectTheme = (theme: typeof PREDEFINED_THEMES[0]) => {
    if (isAdvancedMode) return; // Ignore selection if in advanced mode
    setValue('theme_id', theme.id, { shouldDirty: true });
    setValue('primary_color', theme.primary_color, { shouldDirty: true });
    setValue('accent_color', theme.accent_color, { shouldDirty: true });
    setValue('background_color', theme.background_color, { shouldDirty: true });
    setValue('theme_font', theme.theme_font, { shouldDirty: true });
    setValue('layout_style', theme.layout_style, { shouldDirty: true });

    const fontName = theme.theme_font === 'serif' ? 'Playfair Display' : theme.theme_font === 'rounded' ? 'Outfit' : theme.theme_font === 'modern' ? 'Poppins' : 'Inter';
    const newConfig = {
      global: {
        primary_color: theme.primary_color,
        accent_color: theme.accent_color,
        background_color: theme.background_color,
        background_texture: 'none',
        font_family: fontName,
        custom_css: ''
      },
      sections: {
        header: {
          layout: 'centered',
          show_logo: true,
          show_banner: false,
          circular_text: ''
        },
        category_nav: {
          style: 'sticky-tabs',
          show_category_images: true
        },
        item_list: {
          layout_style: theme.layout_style,
          desktop_columns: theme.layout_style === 'cards' ? 2 : 1,
          show_item_images: true,
          show_calories: true,
          show_allergens: true
        },
        footer: {
          show_socials: true,
          show_contact: true,
          footer_style: 'classic'
        }
      }
    };
    setThemeConfig(newConfig);
    setValue('theme_config', JSON.stringify(newConfig), { shouldDirty: true });
  };

  const handleToggleAdvancedMode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setIsAdvancedMode(enabled);
    if (!enabled) {
      // Find matching theme or revert to Classic Indigo
      const currentTheme = PREDEFINED_THEMES.find(t => t.id === watchThemeId) ?? PREDEFINED_THEMES[0];
      setValue('theme_id', currentTheme.id, { shouldDirty: true });
      setValue('primary_color', currentTheme.primary_color, { shouldDirty: true });
      setValue('accent_color', currentTheme.accent_color, { shouldDirty: true });
      setValue('background_color', currentTheme.background_color, { shouldDirty: true });
      setValue('theme_font', currentTheme.theme_font, { shouldDirty: true });
      setValue('layout_style', currentTheme.layout_style, { shouldDirty: true });

      const fontName = currentTheme.theme_font === 'serif' ? 'Playfair Display' : currentTheme.theme_font === 'rounded' ? 'Outfit' : currentTheme.theme_font === 'modern' ? 'Poppins' : 'Inter';
      const newConfig = {
        global: {
          primary_color: currentTheme.primary_color,
          accent_color: currentTheme.accent_color,
          background_color: currentTheme.background_color,
          background_texture: 'none',
          font_family: fontName,
          custom_css: ''
        },
        sections: {
          header: {
            layout: 'centered',
            show_logo: true,
            show_banner: false,
            circular_text: ''
          },
          category_nav: {
            style: 'sticky-tabs',
            show_category_images: true
          },
          item_list: {
            layout_style: currentTheme.layout_style,
            desktop_columns: currentTheme.layout_style === 'cards' ? 2 : 1,
            show_item_images: true,
            show_calories: true,
            show_allergens: true
          },
          footer: {
            show_socials: true,
            show_contact: true,
            footer_style: 'classic'
          }
        }
      };
      setThemeConfig(newConfig);
      setValue('theme_config', JSON.stringify(newConfig), { shouldDirty: true });
    } else {
      setValue('theme_id', 'custom', { shouldDirty: true });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFeedback(null);

    try {
      const compressedFile = await compressImageToWebP(file);
      const response = await uploadFile(compressedFile, getAccessTokenSilently);
      
      setValue('logo_url', response.url, { shouldDirty: true });
      setFeedback({ type: 'success', message: t('logo_uploaded') });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message ?? t('failed_upload_logo') });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">{t('loading_venue_settings')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(`/venues/${id}/menus`)}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('customize_venue')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('customize_venue_desc', { name: venue?.name })}</p>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-lg flex items-center gap-2 border ${
          feedback.type === 'success'
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {feedback.message}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'branding'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Palette size={16} />
              {t('branding_theme')}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'contact'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Phone size={16} />
              {t('contact_socials')}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('domain')}
            className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'domain'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <GlobeIcon size={16} />
              {t('domain_setup')}
            </span>
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-6">
        {activeTab === 'branding' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Theme customization widgets (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Predefined Themes */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3 mb-2">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="text-amber-500" size={18} />
                    {t('predefined_themes')}
                  </h2>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {t('one_click_apply')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PREDEFINED_THEMES.map((theme) => {
                    const isSelected = watchThemeId === theme.id && !isAdvancedMode;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => handleSelectTheme(theme)}
                        disabled={isAdvancedMode}
                        className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          isAdvancedMode
                            ? 'opacity-40 cursor-not-allowed border-gray-150 bg-gray-50'
                            : isSelected
                              ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-600'
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="font-bold text-sm text-gray-800 mb-2">{theme.name}</span>
                        <div className="flex items-center justify-between w-full">
                          {/* Swatches */}
                          <div className="flex gap-1.5">
                            <span className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: theme.primary_color }} title="Primary" />
                            <span className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: theme.accent_color }} title="Accent" />
                            <span className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: theme.background_color }} title="Background" />
                          </div>
                          {/* Font + Layout metadata tags */}
                          <div className="flex gap-2">
                            <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              {theme.theme_font}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              {theme.layout_style}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Section Builder */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{t('custom_styling_advanced')}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{t('custom_styling_desc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAdvancedMode}
                      onChange={handleToggleAdvancedMode}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {isAdvancedMode && themeConfig && (
                  <div className="space-y-6 pt-2">
                    {/* Section Selector Tab Buttons */}
                    <div className="flex flex-wrap gap-1 border-b border-gray-100 pb-3 mb-4">
                      {[
                        { id: 'global', label: 'Global styling' },
                        { id: 'header', label: 'Header section' },
                        { id: 'nav', label: 'Category Nav' },
                        { id: 'items', label: 'Item list' },
                        { id: 'footer', label: 'Footer section' }
                      ].map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setActiveBuilderSection(s.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeBuilderSection === s.id
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {/* Section customization widgets */}
                    {activeBuilderSection === 'global' && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Primary Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={themeConfig.global.primary_color || '#4f46e5'}
                                onChange={(e) => updateConfigField('global', { primary_color: e.target.value })}
                                className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer flex-shrink-0"
                              />
                              <input
                                type="text"
                                value={themeConfig.global.primary_color || ''}
                                onChange={(e) => updateConfigField('global', { primary_color: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md uppercase font-mono"
                                maxLength={7}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Accent Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={themeConfig.global.accent_color || '#312e81'}
                                onChange={(e) => updateConfigField('global', { accent_color: e.target.value })}
                                className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer flex-shrink-0"
                              />
                              <input
                                type="text"
                                value={themeConfig.global.accent_color || ''}
                                onChange={(e) => updateConfigField('global', { accent_color: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md uppercase font-mono"
                                maxLength={7}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Background Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={themeConfig.global.background_color || '#f3f4f6'}
                                onChange={(e) => updateConfigField('global', { background_color: e.target.value })}
                                className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer flex-shrink-0"
                              />
                              <input
                                type="text"
                                value={themeConfig.global.background_color || ''}
                                onChange={(e) => updateConfigField('global', { background_color: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md uppercase font-mono"
                                maxLength={7}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Typography Font</label>
                            <select
                              value={themeConfig.global.font_family || 'Inter'}
                              onChange={(e) => updateConfigField('global', { font_family: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                            >
                              <option value="Inter">Inter (Sans-Serif)</option>
                              <option value="Playfair Display">Playfair Display (Serif)</option>
                              <option value="Cormorant Garamond">Cormorant Garamond (Paper-look Serif)</option>
                              <option value="Outfit">Outfit (Geometric Rounded)</option>
                              <option value="Poppins">Poppins (Modern Geometric)</option>
                              <option value="Caveat">Caveat (Handwritten Cursive)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Background Texture</label>
                            <select
                              value={themeConfig.global.background_texture || 'none'}
                              onChange={(e) => updateConfigField('global', { background_texture: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                            >
                              <option value="none">None (Flat Color)</option>
                              <option value="paper">Paper Texture</option>
                              <option value="grid">Blueprint Grid</option>
                            </select>
                          </div>
                        </div>

                        <div className="pt-2">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Custom CSS Injection</label>
                          <textarea
                            value={themeConfig.global.custom_css || ''}
                            onChange={(e) => updateConfigField('global', { custom_css: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono text-xs"
                            placeholder="/* Add custom styling rules here */&#10;.item-card { border-radius: 4px; }"
                          />
                        </div>
                      </div>
                    )}

                    {activeBuilderSection === 'header' && (
                      <div className="space-y-4 animate-fadeIn">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Header Layout Style</label>
                          <select
                            value={themeConfig.sections.header.layout || 'centered'}
                            onChange={(e) => updateConfigField('header', { layout: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
                          >
                            <option value="centered">Classic Centered Layout</option>
                            <option value="left-aligned">Left Aligned Layout</option>
                            <option value="circular-text">Circular Badge Layout (SVG rotation)</option>
                          </select>
                        </div>

                        {themeConfig.sections.header.layout === 'circular-text' && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Circular Text Content</label>
                            <input
                              type="text"
                              value={themeConfig.sections.header.circular_text || ''}
                              onChange={(e) => updateConfigField('header', { circular_text: e.target.value })}
                              placeholder="SWEET & DELICIOUS PATISSERIE • FRESHLY BAKED DAILY •"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">This text wraps around the circular venue logo in a clockwise rotation.</p>
                          </div>
                        )}

                        <div className="flex flex-col gap-3 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={themeConfig.sections.header.show_logo !== false}
                              onChange={(e) => updateConfigField('header', { show_logo: e.target.checked })}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span className="text-xs font-medium text-gray-700">Show Brand Logo</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={themeConfig.sections.header.show_banner === true}
                              onChange={(e) => updateConfigField('header', { show_banner: e.target.checked })}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span className="text-xs font-medium text-gray-700">Enable Header Banner Overlay</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {activeBuilderSection === 'nav' && (
                      <div className="space-y-4 animate-fadeIn">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Category Nav Bar Style</label>
                          <select
                            value={themeConfig.sections.category_nav.style || 'sticky-tabs'}
                            onChange={(e) => updateConfigField('category_nav', { style: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
                          >
                            <option value="sticky-tabs">Sticky Pill Tabs (Follows scroll)</option>
                            <option value="list-links">Simple List Links</option>
                          </select>
                        </div>

                        <div className="pt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={themeConfig.sections.category_nav.show_category_images !== false}
                              onChange={(e) => updateConfigField('category_nav', { show_category_images: e.target.checked })}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span className="text-xs font-medium text-gray-700">Show Category Cover Images</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {activeBuilderSection === 'items' && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Item Cards Layout Aesthetic</label>
                            <select
                              value={themeConfig.sections.item_list.layout_style || 'list'}
                              onChange={(e) => updateConfigField('item_list', { layout_style: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
                            >
                              <option value="list">Standard Item Rows</option>
                              <option value="cards">Card Grid Columns</option>
                              <option value="retro-print">Retro Paper Menu</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Desktop Columns (Grid Layout)</label>
                            <select
                              value={themeConfig.sections.item_list.desktop_columns || 1}
                              onChange={(e) => updateConfigField('item_list', { desktop_columns: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
                              disabled={themeConfig.sections.item_list.layout_style !== 'cards'}
                            >
                              <option value={1}>1 Column</option>
                              <option value={2}>2 Columns</option>
                              <option value={3}>3 Columns</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={themeConfig.sections.item_list.show_item_images !== false}
                              onChange={(e) => updateConfigField('item_list', { show_item_images: e.target.checked })}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span className="text-xs font-medium text-gray-700">Show Item Photos</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={themeConfig.sections.item_list.show_calories !== false}
                              onChange={(e) => updateConfigField('item_list', { show_calories: e.target.checked })}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span className="text-xs font-medium text-gray-700">Display Calorie Toggles</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={themeConfig.sections.item_list.show_allergens !== false}
                              onChange={(e) => updateConfigField('item_list', { show_allergens: e.target.checked })}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span className="text-xs font-medium text-gray-700">Show Allergen Information</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {activeBuilderSection === 'footer' && (
                      <div className="space-y-4 animate-fadeIn">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Footer Structure Style</label>
                          <select
                            value={themeConfig.sections.footer.footer_style || 'classic'}
                            onChange={(e) => updateConfigField('footer', { footer_style: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
                          >
                            <option value="classic">Classic Detailed Footer</option>
                            <option value="minimal">Minimalist Centered</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={themeConfig.sections.footer.show_socials !== false}
                              onChange={(e) => updateConfigField('footer', { show_socials: e.target.checked })}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span className="text-xs font-medium text-gray-700">Show Social Media Quick-Links</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={themeConfig.sections.footer.show_contact !== false}
                              onChange={(e) => updateConfigField('footer', { show_contact: e.target.checked })}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span className="text-xs font-medium text-gray-700">Show Physical Location & Contact Info</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!isAdvancedMode && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                    <p className="text-xs text-gray-500 font-semibold">
                      Enable Advanced Custom Styling Mode to configure fine-grained settings on individual sections.
                    </p>
                  </div>
                )}
              </div>

              {/* Logo Upload Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2 border-b pb-2">
                  <Upload size={16} />
                  {t('venue_logo')}
                </h3>
                
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50/50">
                  {watchLogoUrl ? (
                    <div className="relative group w-28 h-28 mb-3">
                      <img 
                        src={watchLogoUrl} 
                        alt="Venue Logo Preview" 
                        className="w-full h-full rounded-full object-cover border-2 border-indigo-100 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setValue('logo_url', '', { shouldDirty: true })}
                        className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold cursor-pointer"
                      >
                        {t('remove_logo')}
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3 border">
                      <Palette size={28} />
                    </div>
                  )}

                  <label className={`px-4 py-2 text-xs font-semibold border border-indigo-200 text-indigo-600 bg-white rounded-md hover:bg-indigo-50 shadow-sm cursor-pointer transition-colors ${
                    isUploading ? 'opacity-50 pointer-events-none' : ''
                  }`}>
                    {isUploading ? t('uploading') : t('choose_image_file')}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden" 
                    />
                  </label>
                  <p className="text-[10px] text-gray-400 mt-2">{t('max_size_formats')}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Live Sticky Preview (5 cols) */}
            <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-gray-900 text-base">Live Menu Preview</h3>
                  <div className="flex border border-gray-200 rounded-lg p-0.5 bg-gray-50">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('mobile')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                        previewMode === 'mobile'
                          ? 'bg-white text-indigo-600 shadow-sm border border-gray-200/50'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Mobile
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('desktop')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                        previewMode === 'desktop'
                          ? 'bg-white text-indigo-600 shadow-sm border border-gray-200/50'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Desktop
                    </button>
                  </div>
                </div>

                {/* Preview Frame Wrapper */}
                <div className="flex justify-center items-center py-4 bg-gray-100 rounded-xl border border-gray-200/50 overflow-hidden min-h-[500px]">
                  {themeConfig && (
                    <div
                      className={`transition-all duration-300 bg-white shadow-lg overflow-y-auto select-none ${
                        previewMode === 'mobile'
                          ? 'w-[300px] h-[520px] rounded-3xl border-8 border-gray-950 flex flex-col justify-between'
                          : 'w-full max-w-[420px] h-[520px] rounded-lg border border-gray-200 flex flex-col justify-between'
                      }`}
                      style={{
                        backgroundColor: themeConfig.global.background_texture === 'paper'
                          ? '#faf6ee'
                          : themeConfig.global.background_color || '#f3f4f6',
                        backgroundImage: themeConfig.global.background_texture === 'paper'
                          ? 'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 0)'
                          : themeConfig.global.background_texture === 'grid'
                            ? 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)'
                            : 'none',
                        backgroundSize: themeConfig.global.background_texture === 'paper'
                          ? '24px 24px'
                          : themeConfig.global.background_texture === 'grid'
                            ? '20px 20px'
                            : 'auto',
                        fontFamily: themeConfig.global.font_family === 'Playfair Display'
                          ? "'Playfair Display', serif"
                          : themeConfig.global.font_family === 'Cormorant Garamond'
                            ? "'Cormorant Garamond', serif"
                            : themeConfig.global.font_family === 'Outfit'
                              ? "'Outfit', sans-serif"
                              : themeConfig.global.font_family === 'Poppins'
                                ? "'Poppins', sans-serif"
                                : themeConfig.global.font_family === 'Caveat'
                                  ? "'Caveat', cursive"
                                  : "'Inter', sans-serif"
                      }}
                    >
                      {/* Inner Menu Preview */}
                      <div className="flex flex-col flex-1">
                        {/* Header Section Preview */}
                        {themeConfig.sections.header.layout === 'circular-text' ? (
                          <div
                            className="p-5 text-white flex flex-col items-center justify-center relative overflow-hidden text-center shrink-0"
                            style={{ backgroundColor: themeConfig.global.primary_color || '#4f46e5' }}
                          >
                            <div className="relative w-20 h-20 flex items-center justify-center mb-1">
                              {/* Rotating circular text SVG */}
                              <svg viewBox="0 0 100 100" className="absolute w-20 h-20 animate-[spin_25s_linear_infinite] pointer-events-none">
                                <path id="previewCirclePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                                <text className="text-[7.5px] uppercase tracking-[0.2em] font-black fill-white/80">
                                  <textPath href="#previewCirclePath">
                                    {themeConfig.sections.header.circular_text || `${watchName || 'VENUE'} MENU • FRESHLY PREPARED • `}
                                  </textPath>
                                </text>
                              </svg>
                              {themeConfig.sections.header.show_logo !== false && watchLogoUrl ? (
                                <img src={watchLogoUrl} alt="Logo" className="w-12 h-12 rounded-full object-cover border border-white/20 shadow-sm" />
                              ) : (
                                <Sparkles size={16} />
                              )}
                            </div>
                            <h1 className="text-base font-black tracking-tight leading-tight">{watchName || 'Venue Name'}</h1>
                          </div>
                        ) : themeConfig.sections.header.layout === 'left-aligned' ? (
                          <div
                            className="p-5 text-white flex items-center gap-4 relative overflow-hidden shrink-0"
                            style={{ backgroundColor: themeConfig.global.primary_color || '#4f46e5' }}
                          >
                            {themeConfig.sections.header.show_banner && (
                              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
                            )}
                            {themeConfig.sections.header.show_logo !== false && watchLogoUrl ? (
                              <img src={watchLogoUrl} alt="Logo" className="w-12 h-12 rounded-full object-cover border border-white/25 shadow-sm" />
                            ) : (
                              <div className="w-12 h-12 bg-white/20 border border-white/20 rounded-full flex items-center justify-center shadow-inner shrink-0">
                                <Sparkles size={16} />
                              </div>
                            )}
                            <div className="text-left min-w-0">
                              <h1 className="text-base font-black tracking-tight truncate">{watchName || 'Venue Name'}</h1>
                              <p className="text-[10px] text-white/80 font-medium">Main Menu</p>
                            </div>
                          </div>
                        ) : (
                          /* Centered Layout */
                          <div
                            className="p-5 text-white flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0"
                            style={{ backgroundColor: themeConfig.global.primary_color || '#4f46e5' }}
                          >
                            {themeConfig.sections.header.show_banner && (
                              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                            )}
                            {themeConfig.sections.header.show_logo !== false && watchLogoUrl ? (
                              <img src={watchLogoUrl} alt="Logo" className="w-12 h-12 rounded-full object-cover border border-white/25 shadow-sm mb-2" />
                            ) : (
                              <div className="w-12 h-12 bg-white/20 border border-white/20 rounded-full flex items-center justify-center mb-2 shadow-inner">
                                <Sparkles size={16} />
                              </div>
                            )}
                            <h1 className="text-base font-black tracking-tight leading-tight">{watchName || 'Venue Name'}</h1>
                            <p className="text-[10px] text-white/80 font-medium mt-0.5">Main Menu</p>
                          </div>
                        )}

                        {/* Category Navigation Preview */}
                        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-2 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 shadow-sm">
                          {['Starters', 'Salads', 'Main Course'].map((c, idx) => (
                            <span
                              key={c}
                              className={`whitespace-nowrap px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all ${
                                idx === 0
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white border-gray-200 text-gray-600'
                              }`}
                              style={idx === 0 ? { backgroundColor: themeConfig.global.primary_color, borderColor: themeConfig.global.primary_color } : {}}
                            >
                              {c}
                            </span>
                          ))}
                        </div>

                        {/* Item List Preview */}
                        <div className="p-4 space-y-4 flex-1">
                          {themeConfig.sections.category_nav.show_category_images !== false && (
                            <div className="w-full h-20 rounded-lg overflow-hidden bg-gray-100 border border-black/5 shrink-0 shadow-sm">
                              <div className="w-full h-full bg-cover bg-center flex items-end p-2 bg-gradient-to-t from-black/60 to-transparent" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400')` }}>
                                <span className="text-[11px] font-bold text-white font-serif uppercase tracking-wider">Starters</span>
                              </div>
                            </div>
                          )}

                          {themeConfig.sections.item_list.layout_style === 'retro-print' ? (
                            <div className="space-y-4 pt-2">
                              {/* Retro print layout preview */}
                              <div className="flex justify-between items-baseline gap-1">
                                <span className="font-bold text-gray-900 font-serif text-[13px]">Caprese Salad</span>
                                <span className="flex-grow border-b border-dashed border-gray-400 mx-1"></span>
                                <span className="font-bold text-gray-955 font-serif text-[13px]">$12.50</span>
                              </div>
                              <p className="text-[11px] text-gray-600 italic font-serif leading-relaxed -mt-2">Ripe vine tomatoes, fresh mozzarella, sweet basil leaves, aged balsamic reduction.</p>
                              {themeConfig.sections.item_list.show_calories !== false && (
                                <p className="text-[9px] text-red-700/80 font-bold -mt-2 font-sans">🔥 320 kcal</p>
                              )}
                              {themeConfig.sections.item_list.show_allergens !== false && (
                                <p className="text-[9px] text-gray-500 font-serif -mt-2">Allergens: dairy</p>
                              )}
                            </div>
                          ) : themeConfig.sections.item_list.layout_style === 'cards' ? (
                            <div className="grid grid-cols-2 gap-3">
                              {/* Card layout preview */}
                              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm flex flex-col justify-between min-h-[140px]">
                                {themeConfig.sections.item_list.show_item_images !== false && (
                                  <div className="w-full h-16 bg-gray-100 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200')` }} />
                                )}
                                <div className="p-2.5 flex-1 flex flex-col justify-between">
                                  <div className="space-y-1">
                                    <h4 className="text-[11px] font-bold text-gray-900 leading-tight">Caprese Salad</h4>
                                    <p className="text-[9px] text-gray-400 line-clamp-2 leading-snug">Ripe vine tomatoes, mozzarella.</p>
                                    {themeConfig.sections.item_list.show_calories !== false && (
                                      <span className="inline-block text-[8px] bg-red-50 text-red-600 font-semibold px-1 rounded">🔥 320 kcal</span>
                                    )}
                                  </div>
                                  <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-gray-50">
                                    <span className="text-[11px] font-black text-accent" style={{ color: themeConfig.global.accent_color }}>$12.50</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm flex flex-col justify-between min-h-[140px]">
                                {themeConfig.sections.item_list.show_item_images !== false && (
                                  <div className="w-full h-16 bg-gray-100 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200')` }} />
                                )}
                                <div className="p-2.5 flex-1 flex flex-col justify-between">
                                  <div className="space-y-1">
                                    <h4 className="text-[11px] font-bold text-gray-900 leading-tight">Bruschetta</h4>
                                    <p className="text-[9px] text-gray-400 line-clamp-2 leading-snug">Grilled artisan bread, tomato, basil.</p>
                                  </div>
                                  <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-gray-50">
                                    <span className="text-[11px] font-black text-accent" style={{ color: themeConfig.global.accent_color }}>$8.50</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Classic List Layout */
                            <div className="space-y-2.5">
                              <div className="flex justify-between items-center p-2.5 bg-white border border-gray-100 rounded-lg shadow-sm">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {themeConfig.sections.item_list.show_item_images !== false && (
                                    <div className="w-10 h-10 rounded-md bg-gray-100 bg-cover bg-center shrink-0" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100')` }} />
                                  )}
                                  <div className="min-w-0">
                                    <h4 className="text-[11px] font-bold text-gray-900 leading-tight">Caprese Salad</h4>
                                    <p className="text-[9px] text-gray-400 truncate leading-snug">Ripe vine tomatoes, mozzarella, basil.</p>
                                    {themeConfig.sections.item_list.show_calories !== false && (
                                      <span className="inline-block text-[8px] bg-red-50 text-red-600 font-semibold px-1 rounded mt-0.5">🔥 320 kcal</span>
                                    )}
                                  </div>
                                </div>
                                <span className="text-[11px] font-black text-accent shrink-0 pl-2" style={{ color: themeConfig.global.accent_color }}>$12.50</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Section Preview */}
                      {themeConfig.sections.footer.footer_style === 'minimal' ? (
                        <div className="bg-white border-t border-gray-100/60 p-4 text-center shrink-0 space-y-2">
                          {themeConfig.sections.footer.show_socials !== false && (
                            <div className="flex justify-center items-center gap-3">
                              <InstagramIcon size={12} className="text-gray-400" />
                              <FacebookIcon size={12} className="text-gray-400" />
                            </div>
                          )}
                          <p className="text-[8px] text-gray-400">© 2026 {watchName || 'Venue'}. All rights reserved.</p>
                        </div>
                      ) : (
                        /* Classic Footer Layout */
                        <div className="bg-white border-t border-gray-100 p-4 text-center shrink-0 space-y-3">
                          {themeConfig.sections.footer.show_socials !== false && (
                            <div className="flex justify-center items-center gap-3">
                              <span className="p-1.5 bg-gray-50 text-gray-400 rounded-full border border-black/5">
                                <InstagramIcon size={10} />
                              </span>
                              <span className="p-1.5 bg-gray-50 text-gray-400 rounded-full border border-black/5">
                                <FacebookIcon size={10} />
                              </span>
                            </div>
                          )}
                          {themeConfig.sections.footer.show_contact !== false && (
                            <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-gray-50 text-[8px] text-gray-500 font-semibold">
                              <span>Call Us</span>
                              <span>Find Us</span>
                              <span>Email Us</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          /* Contact & Socials Tab */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">{t('contact_details_links')}</h2>
              <p className="text-sm text-gray-500">{t('contact_details_desc')}</p>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                    <Phone size={14} className="text-gray-400" />
                    {t('phone_number')}
                  </label>
                  <input
                    {...register('phone')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="+1 (555) 019-2834"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                    <Mail size={14} className="text-gray-400" />
                    {t('contact_email')}
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="contact@sunrise-cafe.com"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('country', 'Country')}
                  </label>
                  <select
                    {...register('country_code')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="TR">Turkey (TR)</option>
                    <option value="US">United States (US)</option>
                    <option value="GB">United Kingdom (GB)</option>
                    <option value="DE">Germany (DE)</option>
                    <option value="FR">France (FR)</option>
                  </select>
                  {errors.country_code && <p className="mt-1 text-xs text-red-600">{errors.country_code.message}</p>}
                </div>
              </div>              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  <MapPin size={14} className="text-gray-400" />
                  {t('physical_address')}
                </label>
                <textarea
                  {...register('address')}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="123 Ocean Blvd, Miami FL, 33139"
                />
              </div>

              <div className="border-t border-gray-100 my-6 pt-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('website_social_links')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <GlobeIcon size={14} className="text-gray-400" />
                      {t('website_url')}
                    </label>
                    <input
                      {...register('website')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://sunrise-cafe.com"
                    />
                    {errors.website && <p className="mt-1 text-xs text-red-600">{errors.website.message}</p>}
                  </div>

                  {/* Instagram */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <InstagramIcon size={14} className="text-gray-400" />
                      {t('instagram_url')}
                    </label>
                    <input
                      {...register('instagram')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://instagram.com/sunrise_cafe"
                    />
                    {errors.instagram && <p className="mt-1 text-xs text-red-600">{errors.instagram.message}</p>}
                  </div>

                  {/* Facebook */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <FacebookIcon size={14} className="text-gray-400" />
                      {t('facebook_url')}
                    </label>
                    <input
                      {...register('facebook')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://facebook.com/sunrise.cafe"
                    />
                    {errors.facebook && <p className="mt-1 text-xs text-red-600">{errors.facebook.message}</p>}
                  </div>

                  {/* Twitter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <TwitterIcon size={14} className="text-gray-400" />
                      {t('twitter_url')}
                    </label>
                    <input
                      {...register('twitter')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://x.com/sunrise_cafe"
                    />
                    {errors.twitter && <p className="mt-1 text-xs text-red-600">{errors.twitter.message}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'domain' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('custom_domain_config')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('custom_domain_config_desc')}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('custom_domain_label')}</label>
                <input
                  {...register('custom_domain')}
                  disabled={!domainAllowed}
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-150 disabled:text-gray-400 disabled:cursor-not-allowed"
                  placeholder={domainAllowed ? 'menu.myrestaurant.com' : t('upgrade_to_use_custom_domain_placeholder')}
                />
                {errors.custom_domain && <p className="mt-1 text-xs text-red-600">{errors.custom_domain.message}</p>}
              </div>

              {!domainAllowed && (
                <div className="border border-amber-250 rounded-xl p-4 bg-amber-50 text-amber-900 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 max-w-2xl shadow-sm">
                  <div>
                    <p className="font-bold">{t('custom_domain_not_supported')}</p>
                    <p className="opacity-90">{t('custom_domain_upgrade_hint')}</p>
                  </div>
                  <Link to="/billing" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors shadow-sm whitespace-nowrap">
                    {t('upgrade_now')}
                  </Link>
                </div>
              )}

              {venue?.custom_domain && (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-4 max-w-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{t('verification_status')}:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      venue.custom_domain_verified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {venue.custom_domain_verified ? t('verified') : t('pending_verification')}
                    </span>
                  </div>

                  {!venue.custom_domain_verified && (
                    <div className="space-y-3">
                      <div className="text-xs text-gray-600 space-y-2">
                        <p className="font-bold">{t('domain_setup_steps_title')}</p>
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>
                            {t('domain_setup_step1')}
                          </li>
                          <li>
                            {t('domain_setup_step2_prefix')} <strong>{t('txt_record')}</strong> {t('domain_setup_step2_suffix')}
                            <div className="bg-gray-200 p-2 rounded font-mono text-[11px] mt-1 break-all">
                              {t('domain_host_label')}: @ ({t('or_subdomain')})<br />
                              Value: qr-menu-verification={venue.domain_verification_token}
                            </div>
                          </li>
                          <li>
                            {t('domain_setup_step3_prefix')} <strong>{t('cname_record')}</strong> {t('domain_setup_step3_suffix')}
                            <div className="bg-gray-200 p-2 rounded font-mono text-[11px] mt-1">
                              {t('domain_host_label')}: @ ({t('or_subdomain')})<br />
                              Value: {getBaseDomain()}
                            </div>
                          </li>
                        </ol>
                        <p className="text-[11px] text-gray-500">
                          {t('domain_guide_prefix')} <a href="https://docs.qr-menu.workouse.com/user/venue/custom-domain" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">{t('custom_domain_setup_guide')}</a>.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => verifyDomainMutation.mutate()}
                        disabled={verifyDomainMutation.isPending}
                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow disabled:opacity-50"
                      >
                        {verifyDomainMutation.isPending ? t('verifying') : t('verify_dns_records')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(`/venues/${id}/menus`)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Save size={16} />
            {updateMutation.isPending ? t('saving_customizations') : t('save_customizations')}
          </button>
        </div>
      </form>
    </div>
  );
};
