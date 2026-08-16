import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithNotifications } from '../../test/renderWithProviders';
import ImageGalleryModal from './ImageGalleryModal';
import { Media } from '../../types/media';

const galleryImage = (overrides: Partial<Media> = {}): Media => ({
  id: 1,
  url: 'https://example.test/1.jpg',
  collection: 'gallery',
  mime_type: 'image/jpeg',
  size: 1024,
  sort_order: 0,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('ImageGalleryModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the empty state when there are no images', () => {
    renderWithNotifications(
      <ImageGalleryModal
        title="Şəkillər — Test Venue"
        images={[]}
        onClose={vi.fn()}
        onChange={vi.fn()}
        onUpload={vi.fn()}
        onDelete={vi.fn()}
        onSetCover={vi.fn()}
        onReorder={vi.fn()}
      />
    );

    expect(screen.getByText('Hələ heç bir şəkil əlavə edilməyib.')).toBeInTheDocument();
  });

  it('renders images sorted by sort_order, with the cover badge on the right one', () => {
    const images = [
      galleryImage({ id: 1, sort_order: 1, url: 'https://example.test/second.jpg' }),
      galleryImage({ id: 2, sort_order: 0, collection: 'cover', url: 'https://example.test/first.jpg' }),
    ];

    renderWithNotifications(
      <ImageGalleryModal
        title="Şəkillər"
        images={images}
        onClose={vi.fn()}
        onChange={vi.fn()}
        onUpload={vi.fn()}
        onDelete={vi.fn()}
        onSetCover={vi.fn()}
        onReorder={vi.fn()}
      />
    );

    const thumbs = screen.getAllByRole('img') as HTMLImageElement[];
    expect(thumbs.map((img) => img.src)).toEqual(['https://example.test/first.jpg', 'https://example.test/second.jpg']);
    expect(screen.getByText('Əsas')).toBeInTheDocument();
  });

  it('uploading appends the new image', async () => {
    const user = userEvent.setup();
    const newMedia = galleryImage({ id: 3, sort_order: 1 });
    const onUpload = vi.fn().mockResolvedValue(newMedia);
    const onChange = vi.fn();

    renderWithNotifications(
      <ImageGalleryModal
        title="Şəkillər"
        images={[galleryImage({ id: 1, collection: 'cover' })]}
        onClose={vi.fn()}
        onChange={onChange}
        onUpload={onUpload}
        onDelete={vi.fn()}
        onSetCover={vi.fn()}
        onReorder={vi.fn()}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(['bytes'], 'new.jpg', { type: 'image/jpeg' }));

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    expect(onChange).toHaveBeenCalledWith([galleryImage({ id: 1, collection: 'cover' }), newMedia]);
  });

  it('setting a new cover demotes the previous cover locally', async () => {
    const user = userEvent.setup();
    const images = [
      galleryImage({ id: 1, sort_order: 0, collection: 'cover' }),
      galleryImage({ id: 2, sort_order: 1 }),
    ];
    const promoted = galleryImage({ id: 2, sort_order: 1, collection: 'cover' });
    const onSetCover = vi.fn().mockResolvedValue(promoted);
    const onChange = vi.fn();

    renderWithNotifications(
      <ImageGalleryModal
        title="Şəkillər"
        images={images}
        onClose={vi.fn()}
        onChange={onChange}
        onUpload={vi.fn()}
        onDelete={vi.fn()}
        onSetCover={onSetCover}
        onReorder={vi.fn()}
      />
    );

    // Only the non-cover thumbnail (id 2) has a "make cover" button.
    await user.click(screen.getByTitle('Əsas şəkil et'));

    await waitFor(() => expect(onSetCover).toHaveBeenCalledWith(2));
    expect(onChange).toHaveBeenCalledWith([
      { ...images[0], collection: 'gallery' },
      promoted,
    ]);
  });

  it('deletes an image and removes it from the list', async () => {
    const user = userEvent.setup();
    const images = [galleryImage({ id: 1 }), galleryImage({ id: 2, sort_order: 1 })];
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onChange = vi.fn();

    renderWithNotifications(
      <ImageGalleryModal
        title="Şəkillər"
        images={images}
        onClose={vi.fn()}
        onChange={onChange}
        onUpload={vi.fn()}
        onDelete={onDelete}
        onSetCover={vi.fn()}
        onReorder={vi.fn()}
      />
    );

    const items = document.querySelectorAll('.image-gallery-item');
    await user.click(within(items[0] as HTMLElement).getByTitle('Sil'));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(1));
    expect(onChange).toHaveBeenCalledWith([images[1]]);
  });
});
