import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi, uploadFile } from '../api/client';
import { compressImageToWebP } from '../utils/image-compression';
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
});
type VenueForm = z.infer<typeof venueSchema>;

export const VenueSettings = () => {
  const { id } = useParams<{ id: string }>();
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'contact'>('branding');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const { t } = useTranslation();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isDirty } } = useForm<VenueForm>({
    resolver: zodResolver(venueSchema),
  });

  const watchThemeId = watch('theme_id');
  const watchPrimaryColor = watch('primary_color');
  const watchAccentColor = watch('accent_color');
  const watchBackgroundColor = watch('background_color');
  const watchThemeFont = watch('theme_font');
  const watchLayoutStyle = watch('layout_style');
  const watchLogoUrl = watch('logo_url');

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
      });
      setIsAdvancedMode(venue.theme_id === 'custom');
    }
  }, [venue, reset]);

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

  const handleSelectTheme = (theme: typeof PREDEFINED_THEMES[0]) => {
    if (isAdvancedMode) return; // Ignore selection if in advanced mode
    setValue('theme_id', theme.id, { shouldDirty: true });
    setValue('primary_color', theme.primary_color, { shouldDirty: true });
    setValue('accent_color', theme.accent_color, { shouldDirty: true });
    setValue('background_color', theme.background_color, { shouldDirty: true });
    setValue('theme_font', theme.theme_font, { shouldDirty: true });
    setValue('layout_style', theme.layout_style, { shouldDirty: true });
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
    <div className="max-w-4xl space-y-6">
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
        </nav>
      </div>

      <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-6">
        {activeTab === 'branding' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left side: Themes & Config */}
            <div className="md:col-span-2 space-y-6">
              {/* Predefined Themes Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3 mb-2">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="text-amber-500" size={18} />
                    {t('predefined_themes')}
                  </h2>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
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
                        className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all ${
                          isAdvancedMode 
                            ? 'opacity-40 cursor-not-allowed border-gray-100 bg-gray-50' 
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

              {/* Advanced Mode Toggle */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{t('custom_styling_advanced')}</h3>
                    <p className="text-xs text-gray-500">{t('custom_styling_desc')}</p>
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

                {isAdvancedMode && (
                  <div className="border-t border-gray-100 pt-5 space-y-5 animate-fadeIn">
                    {/* Colors grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{t('primary_color')}</label>
                        <div className="flex gap-2">
                          <input 
                            type="color" 
                            value={watchPrimaryColor}
                            onChange={(e) => {
                              setValue('primary_color', e.target.value, { shouldDirty: true });
                              setValue('theme_id', 'custom');
                            }}
                            className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer flex-shrink-0"
                          />
                          <input 
                            type="text" 
                            {...register('primary_color')}
                            onChange={(e) => {
                              setValue('primary_color', e.target.value, { shouldDirty: true });
                              setValue('theme_id', 'custom');
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md uppercase"
                            placeholder="#4F46E5"
                            maxLength={7}
                          />
                        </div>
                        {errors.primary_color && <p className="mt-1 text-xs text-red-600">{errors.primary_color.message}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{t('accent_color')}</label>
                        <div className="flex gap-2">
                          <input 
                            type="color" 
                            value={watchAccentColor}
                            onChange={(e) => {
                              setValue('accent_color', e.target.value, { shouldDirty: true });
                              setValue('theme_id', 'custom');
                            }}
                            className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer flex-shrink-0"
                          />
                          <input 
                            type="text" 
                            {...register('accent_color')}
                            onChange={(e) => {
                              setValue('accent_color', e.target.value, { shouldDirty: true });
                              setValue('theme_id', 'custom');
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md uppercase"
                            placeholder="#312E81"
                            maxLength={7}
                          />
                        </div>
                        {errors.accent_color && <p className="mt-1 text-xs text-red-600">{errors.accent_color.message}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{t('background_color')}</label>
                        <div className="flex gap-2">
                          <input 
                            type="color" 
                            value={watchBackgroundColor}
                            onChange={(e) => {
                              setValue('background_color', e.target.value, { shouldDirty: true });
                              setValue('theme_id', 'custom');
                            }}
                            className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer flex-shrink-0"
                          />
                          <input 
                            type="text" 
                            {...register('background_color')}
                            onChange={(e) => {
                              setValue('background_color', e.target.value, { shouldDirty: true });
                              setValue('theme_id', 'custom');
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md uppercase"
                            placeholder="#F3F4F6"
                            maxLength={7}
                          />
                        </div>
                        {errors.background_color && <p className="mt-1 text-xs text-red-600">{errors.background_color.message}</p>}
                      </div>
                    </div>

                    {/* Font & Layout Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{t('typography_font')}</label>
                        <select
                          value={watchThemeFont}
                          onChange={(e) => {
                            setValue('theme_font', e.target.value, { shouldDirty: true });
                            setValue('theme_id', 'custom');
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        >
                          <option value="sans">{t('inter_font')}</option>
                          <option value="serif">{t('playfair_font')}</option>
                          <option value="rounded">{t('outfit_font')}</option>
                          <option value="modern">{t('poppins_font')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{t('menu_items_layout')}</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setValue('layout_style', 'list', { shouldDirty: true });
                              setValue('theme_id', 'custom');
                            }}
                            className={`flex-1 py-2 text-sm font-semibold border rounded-md transition-colors ${
                              watchLayoutStyle === 'list'
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {t('list_view')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setValue('layout_style', 'cards', { shouldDirty: true });
                              setValue('theme_id', 'custom');
                            }}
                            className={`flex-1 py-2 text-sm font-semibold border rounded-md transition-colors ${
                              watchLayoutStyle === 'cards'
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {t('card_grid_view')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Venue Info / Logo Upload */}
            <div className="space-y-6">
              {/* Logo Upload Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
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

              {/* Live Preview Swatch */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h3 className="font-bold text-gray-900">{t('live_preview_swatches')}</h3>
                <div className="rounded-xl p-4 border border-gray-100 shadow-inner" style={{ backgroundColor: watchBackgroundColor }}>
                  <div className="rounded-xl px-4 py-6 text-white text-center font-bold shadow-sm" style={{ backgroundColor: watchPrimaryColor }}>
                    <div className="w-10 h-10 mx-auto rounded-full bg-white/20 border border-white/20 flex items-center justify-center mb-2">
                      {watchLogoUrl ? (
                        <img src={watchLogoUrl} alt="Logo" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <Sparkles size={16} />
                      )}
                    </div>
                    <span className="text-sm font-black uppercase tracking-wide block" style={{ fontFamily: watchThemeFont === 'serif' ? 'serif' : watchThemeFont === 'rounded' ? 'Outfit, sans-serif' : 'sans-serif' }}>
                      {watch('name') || t('venue_name')}
                    </span>
                  </div>
                  
                  <div className="mt-4 p-3 bg-white border border-gray-100 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-gray-50 border flex-shrink-0" />
                      <div className="h-4 bg-gray-100 w-24 rounded-full" />
                    </div>
                    <span className="text-xs font-black" style={{ color: watchAccentColor }}>$12.50</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
