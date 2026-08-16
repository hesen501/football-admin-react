import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithNotifications } from '../../test/renderWithProviders';
import SingleImageField from './SingleImageField';
import { Media } from '../../types/media';

const media: Media = {
  id: 1,
  url: 'https://example.test/photo.jpg',
  collection: 'image',
  mime_type: 'image/jpeg',
  size: 1024,
  sort_order: 0,
  created_at: '2026-01-01T00:00:00Z',
};

describe('SingleImageField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a placeholder and "Yüklə" when there is no image', () => {
    renderWithNotifications(
      <SingleImageField label="Şəkil" image={null} onUpload={vi.fn()} onDelete={vi.fn()} onChange={vi.fn()} />
    );

    expect(screen.getByText('Şəkil')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yüklə/i })).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^sil$/i })).not.toBeInTheDocument();
  });

  it('shows the image and a remove button when one is set', () => {
    renderWithNotifications(
      <SingleImageField label="Şəkil" image={media} onUpload={vi.fn()} onDelete={vi.fn()} onChange={vi.fn()} />
    );

    expect(screen.getByRole('img')).toHaveAttribute('src', media.url);
    expect(screen.getByRole('button', { name: /dəyiş/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sil/i })).toBeInTheDocument();
  });

  it('uploads the selected file and reports the new media back', async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn().mockResolvedValue(media);
    const onChange = vi.fn();

    renderWithNotifications(
      <SingleImageField label="Şəkil" image={null} onUpload={onUpload} onDelete={vi.fn()} onChange={onChange} />
    );

    const file = new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(file));
    expect(onChange).toHaveBeenCalledWith(media);
  });

  it('deletes the image and reports null back', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onChange = vi.fn();

    renderWithNotifications(
      <SingleImageField label="Şəkil" image={media} onUpload={vi.fn()} onDelete={onDelete} onChange={onChange} />
    );

    await user.click(screen.getByRole('button', { name: /sil/i }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('shows the backend error message when upload fails, without calling onChange', async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn().mockRejectedValue({
      response: { data: { message: 'Şəkil ölçüsü çox böyükdür.' } },
    });
    const onChange = vi.fn();

    renderWithNotifications(
      <SingleImageField label="Şəkil" image={null} onUpload={onUpload} onDelete={vi.fn()} onChange={onChange} />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(['bytes'], 'huge.jpg', { type: 'image/jpeg' }));

    expect(await screen.findByText('Şəkil ölçüsü çox böyükdür.')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
