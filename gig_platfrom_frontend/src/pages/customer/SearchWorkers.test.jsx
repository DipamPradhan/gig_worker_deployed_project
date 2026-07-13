import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import SearchWorkers from './SearchWorkers';

const { mockGetCategories, mockGetRecommendedWorkers } = vi.hoisted(() => ({
  mockGetCategories: vi.fn(),
  mockGetRecommendedWorkers: vi.fn(),
}));

vi.mock('../../api', () => ({
  servicesService: {
    getCategories: mockGetCategories,
    getRecommendedWorkers: mockGetRecommendedWorkers,
  },
}));

describe('SearchWorkers page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows workers ranked by highest score first', async () => {
    const user = userEvent.setup();

    mockGetCategories.mockResolvedValue([{ id: 1, name: 'Electrician' }]);
    mockGetRecommendedWorkers.mockResolvedValue([
      {
        worker_id: 2,
        worker_name: 'Second Worker',
        final_score: 0.45,
        bayesian_rating: 3.8,
        distance_km: 3,
        sentiment_score: 0.2,
      },
      {
        worker_id: 1,
        worker_name: 'Top Worker',
        final_score: 0.9,
        bayesian_rating: 4.7,
        distance_km: 1,
        sentiment_score: 0.9,
      },
    ]);

    render(
      <MemoryRouter>
        <SearchWorkers />
      </MemoryRouter>,
    );

    await screen.findByRole('option', { name: 'Electrician' });
    await user.selectOptions(screen.getByLabelText(/service category/i), '1');
    await user.click(screen.getByRole('button', { name: /search workers/i }));

    expect(await screen.findByText(/top worker/i)).toBeInTheDocument();
    expect(screen.getByText(/ranking score: 90.0/i)).toBeInTheDocument();

    const workerTitles = screen.getAllByRole('heading', { level: 3 });
    expect(workerTitles[0]).toHaveTextContent('Top Worker');
    expect(workerTitles[1]).toHaveTextContent('Second Worker');

    await waitFor(() => {
      expect(mockGetRecommendedWorkers).toHaveBeenCalledWith('1', '10');
    });
  });
});
