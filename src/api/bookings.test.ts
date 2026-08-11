import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from './client';
import { addBookingItem, removeBookingItem } from './bookings';

vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedClient = vi.mocked(apiClient, true);

describe('addBookingItem / removeBookingItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds one unit by sending only item_id — never a quantity', async () => {
    mockedClient.post.mockResolvedValue({ data: { data: { id: 1 } } });

    await addBookingItem(42, 7);

    expect(mockedClient.post).toHaveBeenCalledTimes(1);
    const [url, body] = mockedClient.post.mock.calls[0];
    expect(url).toBe('/api/admin/bookings/42/items');
    expect(body).toEqual({ item_id: 7 });
    expect(body).not.toHaveProperty('quantity');
  });

  it('removes one unit via the {booking}/items/{item} endpoint, one call per unit', async () => {
    mockedClient.delete.mockResolvedValue({ data: { data: { id: 1 } } });

    await removeBookingItem(42, 7);

    expect(mockedClient.delete).toHaveBeenCalledTimes(1);
    expect(mockedClient.delete).toHaveBeenCalledWith('/api/admin/bookings/42/items/7');
  });
});
