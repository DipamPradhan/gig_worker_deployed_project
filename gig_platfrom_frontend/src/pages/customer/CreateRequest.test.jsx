import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import CreateRequest from './CreateRequest';

const { mockGetCategories, mockCreateRequest, mockNavigate } = vi.hoisted(() => ({
  mockGetCategories: vi.fn(),
  mockCreateRequest: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../../api', () => ({
  servicesService: {
    getCategories: mockGetCategories,
    createRequest: mockCreateRequest,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CreateRequest page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCategories.mockResolvedValue([{ id: 2, name: 'Electrician' }]);
    mockCreateRequest.mockResolvedValue({ id: 50 });
  });

  it('creates request for selected worker from query params', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={['/customer/create-request?worker=9&category=2']}
      >
        <CreateRequest />
      </MemoryRouter>,
    );

    await screen.findByLabelText(/request title/i);
    await user.type(screen.getByLabelText(/request title/i), 'Need urgent wiring fix');
    await user.type(
      screen.getByLabelText(/description/i),
      'Power socket is not working in kitchen.',
    );
    await user.click(screen.getByRole('button', { name: /create request/i }));

    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalledWith({
        category: '2',
        title: 'Need urgent wiring fix',
        description: 'Power socket is not working in kitchen.',
        preferred_worker_id: '9',
      });
    });

    expect(
      await screen.findByText(/service request created successfully/i),
    ).toBeInTheDocument();
  });
});
