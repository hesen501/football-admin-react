import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from './client';
import { uploadImage } from './media';

vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedClient = vi.mocked(apiClient, true);

describe('uploadImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends the file as multipart FormData under the "image" field, with an explicit multipart Content-Type', async () => {
    mockedClient.post.mockResolvedValue({ data: { data: { id: 1, url: 'https://example.test/a.jpg' } } });
    const file = new File(['fake-bytes'], 'photo.jpg', { type: 'image/jpeg' });

    await uploadImage('/api/admin/venues/1/images', file);

    expect(mockedClient.post).toHaveBeenCalledTimes(1);
    const [url, body, config] = mockedClient.post.mock.calls[0];
    expect(url).toBe('/api/admin/venues/1/images');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('image')).toBe(file);
    expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });
  });

  it('resolves with the created Media row', async () => {
    const media = { id: 7, url: 'https://example.test/b.jpg' };
    mockedClient.post.mockResolvedValue({ data: { data: media } });

    const result = await uploadImage('/api/admin/items/1/image', new File([''], 'x.png'));

    expect(result).toEqual(media);
  });
});
