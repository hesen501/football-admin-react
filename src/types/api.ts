// Matches Laravel's default JsonResource / API Resource envelopes
// (see app/Shared/Http/Responses/ApiResponse and *Resource classes).

export interface ApiEnvelope<T> {
  data: T;
}

export interface PaginatedEnvelope<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

export interface ApiErrorPayload {
  message: string;
  error_code?: string;
  errors?: Record<string, string[]>;
}

// Shared list-endpoint query params (page/per_page/sort/search) — see
// app/Shared/Http/Filtering/QueryParams. Resource-specific filters are
// spread alongside these per endpoint.
export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
}
