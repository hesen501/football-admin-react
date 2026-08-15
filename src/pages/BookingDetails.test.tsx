import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from '../context/NotificationContext';
import BookingDetails from './BookingDetails';
import { Booking } from '../types/booking';
import { Item } from '../types/item';
import { PaginatedEnvelope } from '../types/api';
import * as bookingsApi from '../api/bookings';
import * as itemsApi from '../api/items';

vi.mock('../api/bookings');
vi.mock('../api/items');

const mockedBookingsApi = vi.mocked(bookingsApi, true);
const mockedItemsApi = vi.mocked(itemsApi, true);

const paginatedItems = (data: Item[]): PaginatedEnvelope<Item> => ({
  data,
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, path: '', per_page: 100, to: data.length, total: data.length },
});

const activeCatalog: Item[] = [
  { id: 1, name: 'Water Bottle', price: 1, status: 'ACTIVE', created_at: '', updated_at: '' },
  { id: 2, name: 'Gloves', price: 3, status: 'ACTIVE', created_at: '', updated_at: '' },
];

// A booking starting well in the future with status PENDING — always
// modifiable per Booking::canModifyItems() on the backend.
const baseBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 10,
  user: { id: 5, name: 'Jane Doe', email: 'jane@example.com', phone: null, status: 'ACTIVE', email_verified_at: null, created_at: '', updated_at: '' },
  field: { id: 3, venue_id: 1, name: 'Field 1', description: null, type: 'OUTDOOR', capacity: 10, hourly_price: 20, status: 'ACTIVE', created_at: '', updated_at: '' },
  venue_id: 1,
  start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
  duration_minutes: 60,
  hourly_price: 20,
  base_price: 40,
  items: [],
  items_total: 0,
  total_price: 40,
  commission_rate: 10,
  commission_amount: 4,
  venue_amount: 36,
  source: 'ADMIN_PANEL',
  status: 'PENDING',
  payment_status: 'PENDING',
  payment_reference: null,
  cancelled_at: null,
  cancellation_reason: null,
  notes: null,
  created_at: '',
  updated_at: '',
  ...overrides,
});

const renderPage = () =>
  render(
    <NotificationProvider>
      <MemoryRouter initialEntries={['/bookings/10']}>
        <Routes>
          <Route path="/bookings/:id" element={<BookingDetails />} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>
  );

describe('BookingDetails page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedItemsApi.listItems.mockResolvedValue(paginatedItems(activeCatalog));
  });

  it('renders booking items and the pricing breakdown exactly as returned by the backend', async () => {
    mockedBookingsApi.getBooking.mockResolvedValue(
      baseBooking({
        base_price: 40,
        items: [
          { id: 1, name: 'Water Bottle', quantity: 3, unit_price: 1, total_price: 3 },
          { id: 2, name: 'Gloves', quantity: 1, unit_price: 3, total_price: 3 },
        ],
        items_total: 6,
        total_price: 46,
      })
    );

    renderPage();

    expect(await screen.findByText('Water Bottle')).toBeInTheDocument();
    expect(screen.getByText('Gloves')).toBeInTheDocument();
    expect(screen.getByText('3 × $1.00')).toBeInTheDocument();
    expect(screen.getByText('1 × $3.00')).toBeInTheDocument();

    // Pricing breakdown — all straight from the mocked backend response,
    // never recomputed client-side.
    expect(screen.getByText('$40.00')).toBeInTheDocument(); // base_price
    expect(screen.getByText('$6.00')).toBeInTheDocument(); // items_total
    expect(screen.getByText('$46.00')).toBeInTheDocument(); // total_price
  });

  it('adding an item calls the API with just that item and refreshes the booking', async () => {
    const user = userEvent.setup();
    mockedBookingsApi.getBooking.mockResolvedValue(baseBooking());
    mockedBookingsApi.addBookingItem.mockResolvedValue(
      baseBooking({
        items: [{ id: 1, name: 'Water Bottle', quantity: 1, unit_price: 1, total_price: 1 }],
        items_total: 1,
        total_price: 41,
      })
    );

    renderPage();
    await screen.findByText('Hələ heç bir məhsul əlavə edilməyib.');

    await user.selectOptions(screen.getByRole('combobox'), '1');
    await user.click(screen.getByRole('button', { name: /^əlavə et$/i }));

    await waitFor(() => expect(mockedBookingsApi.addBookingItem).toHaveBeenCalledWith(10, 1));
    expect(await screen.findByText('Water Bottle')).toBeInTheDocument();
    expect(screen.getByText('1 × $1.00')).toBeInTheDocument();
  });

  it('adding the same item again increases the displayed quantity from the server response', async () => {
    const user = userEvent.setup();
    mockedBookingsApi.getBooking.mockResolvedValue(
      baseBooking({
        items: [{ id: 1, name: 'Water Bottle', quantity: 1, unit_price: 1, total_price: 1 }],
        items_total: 1,
        total_price: 41,
      })
    );
    mockedBookingsApi.addBookingItem.mockResolvedValue(
      baseBooking({
        items: [{ id: 1, name: 'Water Bottle', quantity: 2, unit_price: 1, total_price: 2 }],
        items_total: 2,
        total_price: 42,
      })
    );

    renderPage();
    await screen.findByText('Water Bottle');

    await user.click(screen.getByRole('button', { name: /water bottle.*əlavə et/i }));

    await waitFor(() => expect(mockedBookingsApi.addBookingItem).toHaveBeenCalledWith(10, 1));
    expect(await screen.findByText('2 × $1.00')).toBeInTheDocument();
  });

  it('removing an item calls the correct API', async () => {
    const user = userEvent.setup();
    mockedBookingsApi.getBooking.mockResolvedValue(
      baseBooking({
        items: [{ id: 1, name: 'Water Bottle', quantity: 2, unit_price: 1, total_price: 2 }],
        items_total: 2,
        total_price: 42,
      })
    );
    mockedBookingsApi.removeBookingItem.mockResolvedValue(
      baseBooking({
        items: [{ id: 1, name: 'Water Bottle', quantity: 1, unit_price: 1, total_price: 1 }],
        items_total: 1,
        total_price: 41,
      })
    );

    renderPage();
    await screen.findByText('Water Bottle');

    await user.click(screen.getByRole('button', { name: /water bottle.*bir ədəd sil/i }));

    await waitFor(() => expect(mockedBookingsApi.removeBookingItem).toHaveBeenCalledWith(10, 1));
    expect(await screen.findByText('1 × $1.00')).toBeInTheDocument();
  });

  it('removing the last unit removes the item from the UI', async () => {
    const user = userEvent.setup();
    mockedBookingsApi.getBooking.mockResolvedValue(
      baseBooking({
        items: [{ id: 1, name: 'Water Bottle', quantity: 1, unit_price: 1, total_price: 1 }],
        items_total: 1,
        total_price: 41,
      })
    );
    mockedBookingsApi.removeBookingItem.mockResolvedValue(baseBooking({ items: [], items_total: 0, total_price: 40 }));

    renderPage();
    await screen.findByText('Water Bottle');

    await user.click(screen.getByRole('button', { name: /water bottle.*bir ədəd sil/i }));

    await waitFor(() => expect(mockedBookingsApi.removeBookingItem).toHaveBeenCalledWith(10, 1));
    expect(await screen.findByText('Hələ heç bir məhsul əlavə edilməyib.')).toBeInTheDocument();
    expect(screen.queryByText('Water Bottle')).not.toBeInTheDocument();
  });

  it('shows the backend error message when adding an inactive/unavailable item fails', async () => {
    const user = userEvent.setup();
    mockedBookingsApi.getBooking.mockResolvedValue(baseBooking());
    mockedBookingsApi.addBookingItem.mockRejectedValue({
      response: { data: { message: 'This item is not available.', error_code: 'ITEM_NOT_ACTIVE' } },
    });

    renderPage();
    await screen.findByText('Hələ heç bir məhsul əlavə edilməyib.');

    await user.selectOptions(screen.getByRole('combobox'), '1');
    await user.click(screen.getByRole('button', { name: /^əlavə et$/i }));

    expect(await screen.findByText('This item is not available.')).toBeInTheDocument();
    // The failed request must not have mutated local state into a fake success.
    expect(screen.getByText('Hələ heç bir məhsul əlavə edilməyib.')).toBeInTheDocument();
  });

  it('hides the add-item controls and disables the stepper once the booking can no longer be modified', async () => {
    mockedBookingsApi.getBooking.mockResolvedValue(
      baseBooking({
        status: 'CANCELLED',
        items: [{ id: 1, name: 'Water Bottle', quantity: 1, unit_price: 1, total_price: 1 }],
      })
    );

    renderPage();
    await screen.findByText('Water Bottle');

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /water bottle.*bir ədəd sil/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /water bottle.*əlavə et/i })).toBeDisabled();
  });
});
