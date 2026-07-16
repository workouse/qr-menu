import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../api/client';
import { Building2, MessageSquare, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [heardFrom, setHeardFrom] = useState('');
  
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const createOrgMutation = useMutation({
    mutationFn: async (data: { name: string; surveyResponses: any[] }) => {
      return fetchApi('/organizations', {
        method: 'POST',
        body: JSON.stringify(data),
      }, getAccessTokenSilently);
    },
    onSuccess: async (data: any) => {
      localStorage.setItem('active_org_id', data.id);
      
      // Update the cache immediately so that the OnboardingGuard doesn't see the stale 'needs_onboarding: true' state
      queryClient.setQueryData(['me'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          needs_onboarding: false,
          org_id: data.id,
        };
      });

      await queryClient.invalidateQueries({ queryKey: ['me'] });

      const selectedPlan = localStorage.getItem('selected_plan');
      if (selectedPlan === 'Standard' || selectedPlan === 'Business') {
        try {
          const res = await fetchApi(`/organizations/${data.id}/billing/checkout`, {
            method: 'POST',
            body: JSON.stringify({ tier: selectedPlan })
          }, getAccessTokenSilently);
          localStorage.removeItem('selected_plan');
          if (res.url) {
            window.location.href = res.url;
            return;
          }
        } catch (err) {
          console.error('Failed to redirect to checkout:', err);
        }
      }
      localStorage.removeItem('selected_plan');
      navigate('/');
    }
  });

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && orgName.trim()) {
      setStep(2);
    } else if (step === 2 && heardFrom.trim()) {
      createOrgMutation.mutate({
        name: orgName.trim(),
        surveyResponses: [
          { question: "Where did you hear about us?", answer: heardFrom.trim() }
        ]
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t('welcome_to_qr_menu')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('lets_get_setup')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : <span>1</span>}
                </div>
                <div className={`w-16 h-1 mx-2 rounded ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <span>2</span>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-500">
                {t('step_x_of_y', { current: step, total: 2 })}
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleNext}>
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <label htmlFor="orgName" className="block text-lg font-medium text-gray-700 mb-4">
                  {t('what_is_restaurant_name')}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-3 sm:text-lg border-gray-300 rounded-xl"
                    placeholder={t('restaurant_name_placeholder')}
                    autoFocus
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <label htmlFor="heardFrom" className="block text-lg font-medium text-gray-700 mb-4">
                  {t('where_did_you_hear')}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="heardFrom"
                    value={heardFrom}
                    onChange={(e) => setHeardFrom(e.target.value)}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-3 sm:text-lg border-gray-300 rounded-xl"
                    placeholder={t('where_did_you_hear_placeholder')}
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={createOrgMutation.isPending || (step === 1 && !orgName.trim()) || (step === 2 && !heardFrom.trim())}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {createOrgMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                    {t('setting_up')}
                  </>
                ) : step === 1 ? (
                  <>
                    {t('continue')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                ) : (
                  t('complete_setup')
                )}
              </button>
            </div>
            
            {step === 2 && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {t('back')}
                </button>
              </div>
            )}
            
            {createOrgMutation.isError && (
              <div className="mt-4 text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {t('setup_error')}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
