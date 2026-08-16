import apiClient from './client';
import { ApiEnvelope } from '../types/api';
import { Media } from '../types/media';

/**
 * Every image upload endpoint (venue/field/item images, user avatars) takes
 * the same single 'image' multipart field — see App\Shared\Rules\ImageUploadRules
 * on the backend. Shared here so each entity's api/*.ts file only needs to
 * supply its own URL, not repeat the FormData/header boilerplate.
 */
export const uploadImage = async (url: string, file: File): Promise<Media> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient.post<ApiEnvelope<Media>>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};
