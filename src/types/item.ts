// Mirrors App\Modules\Item\Http\Resources\ItemResource and the
// StoreItemRequest/UpdateItemRequest validation rules. Items are a single
// global catalog (no venue_id) — see ItemPolicy for why only SUPER_ADMIN
// manages them.

export type ItemStatus = 'ACTIVE' | 'INACTIVE';

export const ITEM_STATUSES: ItemStatus[] = ['ACTIVE', 'INACTIVE'];

export interface Item {
  id: number;
  name: string;
  price: number;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
}

export interface ItemFormData {
  name: string;
  price: number;
  status?: ItemStatus;
}
