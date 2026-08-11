import { AxiosError } from 'axios';
import { ApiErrorPayload } from '../types/api';

/** Extracts a human-readable message from any error thrown by an apiClient call. */
export const getErrorMessage = (err: unknown, fallback = 'Something went wrong'): string => {
  const axiosErr = err as AxiosError<ApiErrorPayload>;
  const payload = axiosErr?.response?.data;

  if (payload?.errors) {
    const firstField = Object.values(payload.errors)[0];
    if (firstField?.[0]) return firstField[0];
  }

  if (payload?.message) return payload.message;
  if (err instanceof Error) return err.message;

  return fallback;
};
