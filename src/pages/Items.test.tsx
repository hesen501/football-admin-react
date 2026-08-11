import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithNotifications } from '../test/renderWithProviders';
import Items from './Items';
import { Item } from '../types/item';
import { PaginatedEnvelope } from '../types/api';
import * as itemsApi from '../api/items';

vi.mock('../api/items');

const mockedItemsApi = vi.mocked(itemsApi, true);

const paginated = (data: Item[]): PaginatedEnvelope<Item> => ({
  data,
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, path: '', per_page: 20, to: data.length, total: data.length },
});

const waterBottle: Item = {
  id: 1,
  name: 'Water Bottle',
  price: 1,
  status: 'ACTIVE',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const socks: Item = {
  id: 2,
  name: 'Socks',
  price: 2,
  status: 'INACTIVE',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('Items page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedItemsApi.listItems.mockResolvedValue(paginated([waterBottle, socks]));
  });

  it('renders the items list with name, price and status', async () => {
    renderWithNotifications(<Items />);

    expect(await screen.findByText('Water Bottle')).toBeInTheDocument();

    // Scoped to the table: the filter bar's status <select> also renders
    // "ACTIVE"/"INACTIVE" option text, which would otherwise collide.
    const table = screen.getByRole('table');
    expect(within(table).getByText('Socks')).toBeInTheDocument();
    expect(within(table).getByText('$1.00')).toBeInTheDocument();
    expect(within(table).getByText('$2.00')).toBeInTheDocument();
    expect(within(table).getByText('ACTIVE')).toBeInTheDocument();
    expect(within(table).getByText('INACTIVE')).toBeInTheDocument();
  });

  it('creates an item, sending only name/price/status', async () => {
    const user = userEvent.setup();
    mockedItemsApi.createItem.mockResolvedValue({ ...waterBottle, id: 3, name: 'Gloves', price: 3 });

    renderWithNotifications(<Items />);
    await screen.findByText('Water Bottle');

    await user.click(screen.getByRole('button', { name: /new item/i }));
    await user.type(screen.getByLabelText(/name/i), 'Gloves');

    const priceInput = screen.getByLabelText(/price/i);
    await user.clear(priceInput);
    await user.type(priceInput, '3');

    await user.click(screen.getByRole('button', { name: /create item/i }));

    await waitFor(() => expect(mockedItemsApi.createItem).toHaveBeenCalledTimes(1));
    const payload = mockedItemsApi.createItem.mock.calls[0][0];
    expect(payload).toEqual({ name: 'Gloves', price: 3, status: 'ACTIVE' });
    // Never anything the backend forbids on create.
    expect(payload).not.toHaveProperty('unit_price');
    expect(payload).not.toHaveProperty('total_price');
    expect(payload).not.toHaveProperty('booking_id');
    expect(payload).not.toHaveProperty('quantity');
  });

  it('edits an item', async () => {
    const user = userEvent.setup();
    mockedItemsApi.updateItem.mockResolvedValue({ ...waterBottle, price: 1.5 });

    renderWithNotifications(<Items />);
    await screen.findByText('Water Bottle');

    await user.click(screen.getAllByTitle('Edit')[0]);
    const priceInput = await screen.findByLabelText(/price/i);
    await user.clear(priceInput);
    await user.type(priceInput, '1.5');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(mockedItemsApi.updateItem).toHaveBeenCalledWith(1, { name: 'Water Bottle', price: 1.5, status: 'ACTIVE' })
    );
  });

  it('deactivates an active item and activates an inactive one', async () => {
    const user = userEvent.setup();
    mockedItemsApi.deactivateItem.mockResolvedValue({ ...waterBottle, status: 'INACTIVE' });
    mockedItemsApi.activateItem.mockResolvedValue({ ...socks, status: 'ACTIVE' });

    renderWithNotifications(<Items />);
    await screen.findByText('Water Bottle');

    // Row-scoped: after the first toggle, Water Bottle's own button also
    // becomes "Activate", so an unscoped query would then match two rows.
    const waterBottleRow = screen.getByText('Water Bottle').closest('tr') as HTMLElement;
    await user.click(within(waterBottleRow).getByTitle('Deactivate'));
    await waitFor(() => expect(mockedItemsApi.deactivateItem).toHaveBeenCalledWith(1));

    const socksRow = screen.getByText('Socks').closest('tr') as HTMLElement;
    await user.click(within(socksRow).getByTitle('Activate'));
    await waitFor(() => expect(mockedItemsApi.activateItem).toHaveBeenCalledWith(2));
  });

  it('shows an error toast when loading items fails', async () => {
    mockedItemsApi.listItems.mockReset();
    mockedItemsApi.listItems.mockRejectedValue({
      response: { data: { message: 'Something went wrong loading items.' } },
    });

    renderWithNotifications(<Items />);

    expect(await screen.findByText('Something went wrong loading items.')).toBeInTheDocument();
  });
});
