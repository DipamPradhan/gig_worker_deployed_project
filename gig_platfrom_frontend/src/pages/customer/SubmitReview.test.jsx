import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import SubmitReview from './SubmitReview';

const { mockGetRequests, mockCreateReview } = vi.hoisted(() => ({
  mockGetRequests: vi.fn(),
  mockCreateReview: vi.fn(),
}));

vi.mock('../../api', () => ({
  servicesService: {
    getRequests: mockGetRequests,
  },
  ratingsService: {
    createReview: mockCreateReview,
  },
}));

describe('SubmitReview page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequests.mockResolvedValue([
      {
        id: 1,
        category_name: 'Electrician',
        description: 'Fix switch',
        has_review: false,
        assigned_worker_details: { first_name: 'Sam', last_name: 'Worker' },
      },
    ]);
  });

  it('submits review with rating and comment', async () => {
    const user = userEvent.setup();
    mockCreateReview.mockResolvedValue({ id: 10 });

    render(
      <MemoryRouter initialEntries={['/customer/submit-review?request=1']}>
        <SubmitReview />
      </MemoryRouter>,
    );

    const submitButton = await screen.findByRole('button', { name: /submit review/i });
    expect(submitButton).toBeDisabled();

    const allButtons = screen.getAllByRole('button');
    await user.click(allButtons[0]);
    await user.type(screen.getByLabelText(/your review/i), 'Great service and on time.');
    await user.click(screen.getByRole('button', { name: /submit review/i }));

    await waitFor(() => {
      expect(mockCreateReview).toHaveBeenCalledWith({
        request: '1',
        rating: 1,
        review_text: 'Great service and on time.',
      });
    });

    expect(await screen.findByText(/review submitted successfully/i)).toBeInTheDocument();
  });
});
