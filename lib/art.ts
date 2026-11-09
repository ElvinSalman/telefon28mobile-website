import type { Product } from "@/data/products";
// Missing photographs use the official identity, never an invented product photo.
export function artFor(product: Product): string {
 return product.images?.[0]?.url || "/brand/telefon-28-mobile.svg";
}
