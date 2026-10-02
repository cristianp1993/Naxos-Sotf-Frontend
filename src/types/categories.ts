// Tipos para la gestión de categorías

// Reexportar Category desde products para mantener una sola definición
export type { Category } from './products';

export interface CategoryFormData {
  name: string;
}

export interface CategoryFormErrors {
  name?: string;
}
