// Product shape shared by the storefront, admin and database adapter.
export interface Variant { id: string; size: string; color: string; sku: string; stock: number }
export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string | undefined;
  description: string;
  price: number;
  discountPrice?: number | undefined;
  images: string[];
  /** Raw stored photo paths (admin editing); `images` holds display links. */
  imagePaths?: string[] | undefined;
  sizes: string[];
  colors: string[];
  stock: number;
  sku: string;
  featured: boolean;
  newArrival: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  brand: string;
  isDemo: boolean;
  variants: Variant[];
  lowStockThreshold: number;
}
export interface Category { name: string; image: string; virtual?: boolean }
export interface Filters { query?: string | undefined; category?: string | undefined; maxPrice?: number | undefined; size?: string | undefined; color?: string | undefined; brand?: string | undefined; availability?: string | undefined; style?: string | undefined; sort?: string | undefined; newArrival?: boolean | undefined }
export interface CartLine { productId: string; size: string; color: string; quantity: number }
