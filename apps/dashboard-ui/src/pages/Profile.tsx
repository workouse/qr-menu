import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../api/client';
import { useAuth0 } from '@auth0/auth0-react';
import { CheckCircle, AlertCircle, Save, User, ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------------
// Zod Schema
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine((data) => {
  if (data.password && data.password.trim() !== '') {
    return data.password.length >= 6;
  }
  return true;
}, {
  message: 'Password must be at least 6 characters',
  path: ['password'],
}).refine((data) => {
  if (data.password && data.password.trim() !== '') {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;

export const Profile = () => {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { t } = useTranslation();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => fetchApi('/profile', {}, getAccessTokenSilently),
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name ?? '',
        phone: profile.phone ?? '',
        email: profile.email ?? '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm) => {
      const payload: any = {
        name: data.name,
        phone: data.phone,
      };
      
      // Only send email/password if the user is not OAuth
      if (!profile?.is_oauth) {
        payload.email = data.email;
        if (data.password && data.password.trim() !== '') {
          payload.password = data.password;
        }
      }

      return fetchApi('/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }, getAccessTokenSilently);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setFeedback({ type: 'success', message: t('profile_saved', 'Profile updated successfully.') });
      reset(undefined, { keepValues: true, keepDirtyValues: false });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message ?? t('failed_save_profile', 'Failed to update profile.') });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isOauth = profile?.is_oauth;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('personal_profile', 'Personal Profile')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('personal_profile_desc', 'Update your personal information, email, and password.')}
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
          feedback.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-6">
        {/* Personal Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              {t('profile_details', 'Profile Details')}
            </h2>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('name', 'Name')}
                </label>
                <input
                  type="text"
                  id="profile-name"
                  {...register('name')}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.name 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('phone_number', 'Phone Number')}
                </label>
                <input
                  type="text"
                  id="profile-phone"
                  placeholder={t('phone_number_placeholder', 'e.g. +1234567890')}
                  {...register('phone')}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.phone 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div className="sm:col-span-4">
                <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('email', 'Email Address')}
                </label>
                <input
                  type="email"
                  id="profile-email"
                  {...register('email')}
                  readOnly={isOauth}
                  disabled={isOauth}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all ${
                    isOauth 
                      ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' 
                      : errors.email 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                />
                {isOauth && (
                  <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                    <ShieldAlert size={14} className="shrink-0" />
                    {t('email_oauth_warning', 'Email cannot be updated for social login accounts.')}
                  </p>
                )}
                {!isOauth && errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security / Password Card (Only shown/enabled for standard users) */}
        {!isOauth && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {t('security', 'Security')}
              </h2>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="profile-password" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('new_password', 'New Password')}
                  </label>
                  <input
                    type="password"
                    id="profile-password"
                    placeholder={t('password_placeholder', 'Leave blank to keep current password')}
                    {...register('password')}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                    }`}
                  />
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="profile-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('confirm_password', 'Confirm New Password')}
                  </label>
                  <input
                    type="password"
                    id="profile-confirm-password"
                    {...register('confirmPassword')}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.confirmPassword 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OAuth Warning Block for password settings */}
        {isOauth && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 flex items-start space-x-3 text-amber-800">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">{t('security', 'Security')}</p>
              <p className="text-xs text-amber-700 mt-1">
                {t('password_oauth_warning', 'Password settings are managed by your identity provider.')}
              </p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || updateMutation.isPending}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {updateMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save size={18} className="mr-2" />
            )}
            {t('save_changes', 'Save Changes')}
          </button>
        </div>
      </form>
    </div>
  );
};
