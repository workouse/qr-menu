import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function CreateVenueForm({ orgId }: { orgId: string }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/organizations/${orgId}/venues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, slug }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('create_new_venue')}</h2>
      
      <div className="mb-4">
        <label htmlFor="venueName" className="block text-gray-700 font-medium mb-2">{t('venue_name')}</label>
        <input
          id="venueName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t('venue_name_placeholder')}
          required
        />
      </div>

      <div className="mb-6">
        <label htmlFor="venueSlug" className="block text-gray-700 font-medium mb-2">{t('venue_slug')}</label>
        <input
          id="venueSlug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t('venue_slug_placeholder')}
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
      >
        {t('create_venue')}
      </button>
    </form>
  );
}
