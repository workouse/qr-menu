import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../api/client';
import { useAuth0 } from '@auth0/auth0-react';
import { CheckCircle, AlertCircle, Save, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useTierLimits } from '../hooks/useTierLimits';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const settingsSchema = z.object({
  name: z.string().min(2, 'Organisation name must be at least 2 characters'),
  currency: z.string().min(2, 'Currency code is required').max(3, 'Use a 3-letter code (e.g. USD)').toUpperCase(),
  currency_symbol: z.string().min(1, 'Currency symbol is required').max(4, 'Symbol too long'),
});
type SettingsForm = z.infer<typeof settingsSchema>;

const languageSchema = z.object({
  language_code: z.string().min(2, 'Code required').max(10).toLowerCase(),
  language_name: z.string().min(1, 'Name required'),
  is_default: z.boolean().default(false),
});
type LanguageForm = z.output<typeof languageSchema>;

// ---------------------------------------------------------------------------
// Settings page
// ---------------------------------------------------------------------------

export const Settings = () => {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const { t } = useTranslation();

  const activeOrgId = localStorage.getItem('active_org_id');

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', activeOrgId],
    queryFn: () => fetchApi(`/organizations/${activeOrgId}`, {}, getAccessTokenSilently),
    enabled: !!activeOrgId,
  });

  const { data: languages, isLoading: langsLoading } = useQuery({
    queryKey: ['org-languages', activeOrgId],
    queryFn: () => fetchApi(`/organizations/${activeOrgId}/languages`, {}, getAccessTokenSilently),
    enabled: !!activeOrgId,
  });

  const { limits, checkLanguageLimit, tier } = useTierLimits();
  const extraLanguagesCount = languages?.filter((l: any) => !l.is_default)?.length || 0;
  const isLanguageLimitReached = !checkLanguageLimit(extraLanguagesCount);

  const { register, handleSubmit, reset: resetSettings, formState: { errors, isDirty } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  });

  const { register: regLang, handleSubmit: submitLang, reset: resetLang, formState: { errors: langErrors } } = useForm<LanguageForm>({
    resolver: zodResolver(languageSchema) as any,
    defaultValues: { is_default: false },
  });

  useEffect(() => {
    if (org) {
      resetSettings({
        name: org.name ?? '',
        currency: org.currency ?? 'USD',
        currency_symbol: org.currency_symbol ?? '$',
      });
    }
  }, [org, resetSettings]);

  const updateMutation = useMutation({
    mutationFn: (data: SettingsForm) =>
      fetchApi(`/organizations/${activeOrgId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }, getAccessTokenSilently),
    onSuccess: (updated) => {
      queryClient.setQueryData(['organization', activeOrgId], updated);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      resetSettings({ name: updated.name, currency: updated.currency, currency_symbol: updated.currency_symbol });
      setFeedback({ type: 'success', message: t('settings_saved') });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message ?? t('failed_save_settings') });
    },
  });

  const addLanguageMutation = useMutation({
    mutationFn: (data: LanguageForm) =>
      fetchApi(`/organizations/${activeOrgId}/languages`, {
        method: 'POST',
        body: JSON.stringify(data),
      }, getAccessTokenSilently),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-languages', activeOrgId] });
      setIsAddingLanguage(false);
      resetLang({ language_code: '', language_name: '', is_default: false });
      setFeedback({ type: 'success', message: t('language_added') });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message ?? t('failed_add_language') });
    },
  });

  const deleteLanguageMutation = useMutation({
    mutationFn: (langCode: string) =>
      fetchApi(`/organizations/${activeOrgId}/languages/${langCode}`, {
        method: 'DELETE',
      }, getAccessTokenSilently),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-languages', activeOrgId] });
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message ?? t('failed_delete_language') });
    },
  });

  const setDefaultLanguageMutation = useMutation({
    mutationFn: (langCode: string) =>
      fetchApi(`/organizations/${activeOrgId}/languages/${langCode}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_default: true }),
      }, getAccessTokenSilently),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-languages', activeOrgId] });
      setFeedback({ type: 'success', message: t('default_language_updated') });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message ?? t('failed_update_default_language') });
    },
  });

  if (!activeOrgId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">{t('no_active_org')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('organisation_settings')}</h1>

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

      {/* General + Currency */}
      {orgLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <p className="text-gray-500">{t('loading_settings')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">{t('general')}</h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label htmlFor="settings-org-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('org_name')}
              </label>
              <input
                id="settings-org-name"
                {...register('name')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={t('org_name_placeholder')}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
          </div>

          <div className="px-6 py-5 border-t border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">{t('currency')}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('currency_info')} <strong>{t('publish_to_edge')}</strong>.
            </p>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="settings-currency" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('currency_code')} <span className="text-gray-400 font-normal">{t('iso_4217')}</span>
                </label>
                <input
                  id="settings-currency"
                  {...register('currency')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                  placeholder="USD"
                  maxLength={3}
                />
                {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>}
                <p className="mt-1 text-xs text-gray-400">{t('currency_examples')}</p>
              </div>
              <div>
                <label htmlFor="settings-currency-symbol" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Symbol
                </label>
                <input
                  id="settings-currency-symbol"
                  {...register('currency_symbol')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="$"
                  maxLength={4}
                />
                {errors.currency_symbol && <p className="mt-1 text-sm text-red-600">{errors.currency_symbol.message}</p>}
                <p className="mt-1 text-xs text-gray-400">Examples: $, €, £, ₺, ¥</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending || !isDirty}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {updateMutation.isPending ? t('saving') : t('save_changes')}
            </button>
          </div>
        </form>
      )}

      {/* Billing & Subscription */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Billing & Subscription</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your active subscription plan and limits.</p>
        </div>
        <div className="p-6">
          {orgLoading ? (
            <p className="text-sm text-gray-500">Loading subscription details...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Current Plan</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {org?.subscription?.tier || 'Free'}
                    </span>
                    {(org?.subscription?.status === 'active' || org?.subscription?.status === 'on_trial') ? (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-gray-200 text-gray-700 rounded-full">
                        {org?.subscription?.status || 'Active'}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  {org?.subscription?.tier !== 'Enterprise' && (
                    <Link
                      to="/billing"
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Upgrade Plan
                    </Link>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-500 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <p className="font-semibold text-blue-800 mb-2">Usage Limits</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700/80">
                  {(!org?.subscription?.tier || org?.subscription?.tier === 'Free') && (
                    <>
                      <li>1 Venue, 1 Menu per Venue</li>
                      <li>2 Categories, 10 Items per Category</li>
                      <li>1 Extra Language (No Custom Domain)</li>
                      <li>1 Organization</li>
                    </>
                  )}
                  {org?.subscription?.tier === 'Standard' && (
                    <>
                      <li>5 Venues, 2 Menus per Venue</li>
                      <li>30 Categories, 20 Items per Category</li>
                      <li>3 Extra Languages, Custom Domain allowed</li>
                      <li>2 Organizations</li>
                    </>
                  )}
                  {org?.subscription?.tier === 'Business' && (
                    <>
                      <li>5 Venues per Org, 5 Menus per Venue</li>
                      <li>30 Categories, 50 Items per Category</li>
                      <li>10 Extra Languages, Custom Domain + Free Domain Registrar</li>
                      <li>5 Organizations</li>
                    </>
                  )}
                  {org?.subscription?.tier === 'Enterprise' && (
                    <li>Unlimited usage across all limits.</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Language Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLanguageLimitReached && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex justify-between items-center gap-2">
            <span>You have reached the language limit ({extraLanguagesCount}/{limits.languages} extra languages) for your current plan ({tier}).</span>
            <Link to="/billing" className="font-bold hover:underline text-amber-700">Upgrade Plan &rarr;</Link>
          </div>
        )}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold text-gray-800">{t('languages')}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('languages_info_1')} {' '}
              <strong>{t('languages_info_2')}</strong> {t('languages_info_3')}
            </p>
          </div>
          {isLanguageLimitReached ? (
            <Link
              to="/billing"
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-750 text-white rounded-md transition-colors flex-shrink-0 ml-4 font-semibold shadow-sm"
            >
              <Plus size={14} />
              Upgrade to Add Language ({extraLanguagesCount}/{limits.languages})
            </Link>
          ) : (
            <button
              onClick={() => setIsAddingLanguage(v => !v)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex-shrink-0 ml-4"
            >
              {isAddingLanguage ? <X size={14} /> : <Plus size={14} />}
              {isAddingLanguage ? t('cancel') : t('add_language')}
            </button>
          )}
        </div>

        {isAddingLanguage && (
          <form
            onSubmit={submitLang(d => addLanguageMutation.mutate(d))}
            className="px-6 py-4 bg-indigo-50/60 border-b border-indigo-100"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('code_bcp_47')}</label>
                <input
                  {...regLang('language_code')}
                  placeholder="tr"
                  maxLength={10}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                {langErrors.language_code && <p className="mt-1 text-xs text-red-600">{langErrors.language_code.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('display_name')}</label>
                <input
                  {...regLang('language_name')}
                  placeholder="Türkçe"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                {langErrors.language_name && <p className="mt-1 text-xs text-red-600">{langErrors.language_name.message}</p>}
              </div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 pb-2 cursor-pointer">
                  <input type="checkbox" {...regLang('is_default')} className="rounded text-indigo-600" />
                  {t('set_as_default')}
                </label>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={addLanguageMutation.isPending}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {addLanguageMutation.isPending ? t('adding') : t('add_language')}
              </button>
            </div>
          </form>
        )}

        <div className="p-6">
          {langsLoading ? (
            <p className="text-gray-500 text-sm">{t('loading_languages')}</p>
          ) : languages?.length > 0 ? (
            <ul className="space-y-2">
              {/* English fallback — always shown, cannot be removed */}
              <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono bg-gray-200 text-gray-700 px-2 py-0.5 rounded">en</span>
                  <span className="text-sm font-medium text-gray-800">English</span>
                  <span className="text-xs text-gray-500 italic">{t('fallback_always_active')}</span>
                </div>
              </li>
              {languages.map((lang: any) => (
                <li key={lang.language_code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{lang.language_code}</span>
                    <span className="text-sm font-medium text-gray-800">{lang.language_name}</span>
                    {lang.is_default ? (
                      <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">{t('default')}</span>
                    ) : null}
                  </div>
                  {!lang.is_default && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setDefaultLanguageMutation.mutate(lang.language_code)}
                        disabled={setDefaultLanguageMutation.isPending}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                      >
                        {t('set_as_default_btn')}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t('remove_language_confirm', { name: lang.language_name }))) {
                            deleteLanguageMutation.mutate(lang.language_code);
                          }
                        }}
                        disabled={deleteLanguageMutation.isPending}
                        className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                        title={t('remove_language')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-2">{t('no_languages_yet')}</p>
              <p className="text-xs text-gray-400">{t('add_turkish_default')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Local X import (used inline above for the cancel button)
const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
