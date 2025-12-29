export interface Product {
  product_id: number;
  categoria: string;
  name: string;
  description: string;
  image_url: string;
}

export interface Variant {
  product_id: number;
  variant_id: number;
  variant_name: string;
  ounces: number;
  foto_url: string;
  precio_actual: number;
}

export interface Flavor {
  product_id: number;
  sabores_activos: string[];
}

export interface MenuData {
  productos: Product[];
  variantes: Variant[];
  sabores: Flavor[];
}
