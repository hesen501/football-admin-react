// Mirrors App\Modules\Media\Http\Resources\MediaResource. A single uploaded
// file owned by a Venue/Field/Item/User — see App\Shared\Concerns\HasMedia
// on the backend for which collection each entity uses.

export type MediaCollection = 'avatar' | 'cover' | 'gallery' | 'image';

export interface Media {
  id: number;
  url: string;
  collection: MediaCollection;
  mime_type: string;
  size: number;
  sort_order: number;
  created_at: string;
}
