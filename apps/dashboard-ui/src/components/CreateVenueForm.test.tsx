import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';
import { CreateVenueForm } from './CreateVenueForm';

describe('CreateVenueForm', () => {
  it('should submit the form and call the API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'venue_123' })
    });

    render(<CreateVenueForm orgId="org_123" />);

    const nameInput = screen.getByLabelText(/Venue Name/i);
    const slugInput = screen.getByLabelText(/Venue Slug/i);
    const submitButton = screen.getByRole('button', { name: /Create Venue/i });

    fireEvent.change(nameInput, { target: { value: 'New Cafe' } });
    fireEvent.change(slugInput, { target: { value: 'new-cafe' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/organizations/org_123/venues', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ name: 'New Cafe', slug: 'new-cafe' })
      }));
    });
  });
});
