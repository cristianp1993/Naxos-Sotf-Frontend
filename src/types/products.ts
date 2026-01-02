// Tipos para el CRUD de productos

export interface Category {
  category_id: number;
  name: string;
}

export interface Flavor {
  flavor_id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  product_id: number;
  category_id: number;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
  category?: Category; // Relación con Category
  flavors?: Flavor[]; // Relación con sabores
}

// Debe ir después de Product y Flavor
export interface ProductWithFlavors extends Product {
  flavors: Flavor[];
}

export interface ProductFormData {
  category_id: number;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  flavor_ids: number[]; // IDs de sabores asociados al producto
}

export interface ProductsApiResponse {
  success: boolean;
  data: Product[];
  message?: string;
}

export interface ProductApiResponse {
  success: boolean;
  data: Product;
  message?: string;
}

export interface CategoriesApiResponse {
  success: boolean;
  data: Category[];
  message?: string;
}

export interface ProductFormErrors {
  category_id?: string;
  name?: string;
  description?: string;
  image_url?: string;
}

export interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: number) => void;
  loading?: boolean;
}

export interface ProductFormProps {
  initialData?: Product;
  categories: Category[];
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}