// Tipos para la gestión de sabores
export interface Flavor {
  flavor_id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFlavor {
  product_id: number;
  flavor_id: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlavorFormData {
  name: string;
}

export interface FlavorFormErrors {
  name?: string;
}

export interface FlavorFormProps {
  initialData?: Flavor | null;
  onSubmit: (data: FlavorFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

export interface FlavorModalProps {
  isOpen: boolean;
  onClose: () => void;
  flavors: Flavor[];
  productFlavors: number[]; // IDs de sabores asociados al producto
  onSave: (flavorIds: number[]) => void;
  loading?: boolean;
}

export interface ProductWithFlavors extends Product {
  flavors: Flavor[];
}

export interface FlavorService {
  getAllFlavors: () => Promise<Flavor[]>;
  createFlavor: (data: FlavorFormData) => Promise<Flavor>;
  updateFlavor: (id: number, data: FlavorFormData) => Promise<Flavor>;
  deleteFlavor: (id: number) => Promise<void>;
  searchFlavors: (query: string) => Promise<Flavor[]>;
}

export interface ProductFlavorService {
  getProductFlavors: (productId: number) => Promise<Flavor[]>;
  associateFlavorsToProduct: (productId: number, flavorIds: number[]) => Promise<void>;
  removeFlavorFromProduct: (productId: number, flavorId: number) => Promise<void>;
}
