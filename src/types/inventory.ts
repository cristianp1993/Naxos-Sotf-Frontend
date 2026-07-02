export interface InventoryLocation {
  location_id: number;
  name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryStock {
  location_id: number;
  variant_id: number;
  qty_on_hand: number;
  updated_at: string;
  location_name?: string;
  product_id?: number;
  variant_name?: string;
  ounces?: number;
  sku?: string;
  product_name?: string;
  category_name?: string;
}

export interface InventoryMovement {
  movement_id: number;
  location_id: number;
  variant_id: number;
  movement_type: 'PURCHASE' | 'ADJUSTMENT' | 'SALE' | 'RETURN';
  qty_change: number;
  reason?: string;
  ref_sale_id?: number;
  created_at: string;
  created_by?: number;
  location_name?: string;
  variant_name?: string;
  product_name?: string;
  category_name?: string;
  created_by_username?: string;
}

export interface StockUpdateData {
  location_id: number;
  variant_id: number;
  qty_on_hand: number;
}

export interface MovementData {
  location_id: number;
  variant_id: number;
  movement_type: 'PURCHASE' | 'ADJUSTMENT' | 'SALE' | 'RETURN';
  qty_change: number;
  reason?: string;
  ref_sale_id?: number;
}

export interface LocationFormData {
  name: string;
  is_active: boolean;
}

// API Response Types
export interface LocationsResponse {
  success: boolean;
  message: string;
  data: InventoryLocation[];
}

export interface LocationResponse {
  success: boolean;
  message: string;
  data: InventoryLocation;
}

export interface StockResponse {
  success: boolean;
  message: string;
  data: InventoryStock[];
}

export interface MovementResponse {
  success: boolean;
  message: string;
  data: InventoryMovement;
}

export interface MovementsResponse {
  success: boolean;
  message: string;
  data: InventoryMovement[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface LowStockResponse {
  success: boolean;
  message: string;
  data: InventoryStock[];
  threshold: number;
}

export interface InventorySummaryResponse {
  success: boolean;
  message: string;
  data: {
    category_id: number;
    category_name: string;
    total_variants: number;
    total_quantity: number;
    avg_quantity: number;
    min_quantity: number;
    max_quantity: number;
  }[];
}
