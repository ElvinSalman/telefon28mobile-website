export interface Product {
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  featured?: boolean;
  storage: string;
  color: string;
  images?: { url: string; alt: string }[];
  description?: Record<string, string>;
  specifications?: Record<string, string>;

  verifiedAt: string;
  condition?: "new" | "used" | "refurbished";
}
