import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest'; // mocking utilities
import CreateRequest from './CreateRequest';

// hoisted ensure mocks are created first like the js funcction and var are hoisted
const { mockGetCategories, mockCreateRequest, mockNavigate } = vi.hoisted(() => ({
  mockGetCategories: vi.fn(), // fake function instead of calling real api
  mockCreateRequest: vi.fn(),
  mockNavigate: vi.fn(),
}));

// replace real api with mock api
vi.mock('../../api', () => ({
  servicesService: {
    getCategories: mockGetCategories,
    createRequest: mockCreateRequest,
  },
}));

// mocks the navigation instead of real navigation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// grouping related tests
describe('CreateRequest page', () => {

  // runs before every test
  beforeEach(() => {
    // clear previous calls
    vi.clearAllMocks();
    // fake api response
    mockGetCategories.mockResolvedValue([{ id: 2, name: 'Electrician' }]);
    mockCreateRequest.mockResolvedValue({ id: 50 });
  });

  // one individual test
  it('creates request for selected worker from query params', async () => {
  //  creates a fake user
    const user = userEvent.setup();

    render(
      // provides routing without opening a browser.
      <MemoryRouter
        initialEntries={['/customer/create-request?worker=9&category=2']}
      >
        <CreateRequest />
      </MemoryRouter>,
    );

    // wait until page loads
    await screen.findByLabelText(/request title/i);
    await user.type(screen.getByLabelText(/request title/i), 'Need urgent wiring fix');
    await user.type(
      screen.getByLabelText(/description/i),
      'Power socket is not working in kitchen.',
    );
    await user.click(screen.getByRole('button', { name: /create request/i }));

    // wait until api is called
    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalledWith({
        category: '2',
        title: 'Need urgent wiring fix',
        description: 'Power socket is not working in kitchen.',
        preferred_worker_id: '9',
      });
    });
// after fake api return success  component display
    expect(
      await screen.findByText(/service request created successfully/i),
    ).toBeInTheDocument();
  });
});
