/** Advertised price snapshots. The seller confirms current terms on inquiry. */
export type ProductCategory =
  "phone" | "tablet" | "watch" | "audio" | "gaming" | "other";

export interface Product {
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  storage: string;
  color: string;
  source: string;
  verifiedAt: string;
  condition?: "new" | "used" | "refurbished";
}

export const contact = {
  address: "Azadlıq prospekti 39D, Nəsimi, Bakı",
  phone: "+994 55 600 20 01",
  whatsapp: "994556002001",
};

const sources = [
  "https://ru.tap.az/shops/telefon28mobile",
  "https://ru.tap.az/shops/telefon28mobile?q%5Bregion_id%5D=422",
  "https://ru.tap.az/shops/telefon28mobile?q%5Bregion_id%5D=420",
  "https://tap.az/elanlar/elektronika/telefonlar/39995229",
  "https://tap.az/elanlar/elektronika/smart-saat-ve-qolbaqlar/48607583",
];

type Snapshot = [
  brand: string,
  model: string,
  category: ProductCategory,
  price: number,
  storage: string,
  color: string,
  sourceIndex: number,
];
const snapshots: Snapshot[] = [
  ["Apple", "iPhone 17 Pro", "phone", 1949, "256 GB", "Deep Blue", 0],
  ["Samsung", "Galaxy S26 Ultra", "phone", 2239, "256 GB", "Black", 0],
  ["Apple", "Watch Ultra 3", "watch", 1299, "", "Black", 0],
  ["Sony", "PlayStation 5 Slim", "gaming", 1269, "1 TB", "", 0],
  ["Apple", "iPad Pro 11″ M4", "tablet", 1799, "256 GB", "Black", 0],
  ["Apple", "iPhone Air", "phone", 1649, "256 GB", "Sky Blue", 0],
  ["Apple", "iPhone 14", "phone", 579, "128 GB", "Blue", 0],
  ["Apple", "iPhone 12 Pro Max", "phone", 549, "256 GB", "Graphite", 0],
  ["Apple", "iPhone 14 Pro", "phone", 939, "128 GB", "Deep Purple", 0],
  ["Apple", "iPhone 15 Pro", "phone", 1299, "256 GB", "Blue Titanium", 0],
  [
    "Samsung",
    "Galaxy S24 Ultra",
    "phone",
    1199,
    "256 GB",
    "Titanium Yellow",
    0,
  ],
  ["Apple", "iPhone 17 Pro Max", "phone", 2299, "256 GB", "Silver", 0],
  ["Apple", "iPhone 16 Pro Max", "phone", 1649, "256 GB", "Desert Titanium", 0],
  ["Apple", "MacBook Neo 13″ A18 Pro", "other", 1399, "256 GB", "Silver", 0],
  ["Apple", "iPad A16", "tablet", 899, "128 GB", "Blue", 0],
  ["Apple", "iPad Air 11″ M4", "tablet", 1489, "128 GB", "", 0],
  ["Xiaomi", "Redmi 15", "phone", 449, "256 GB", "Midnight Black", 0],
  ["Dyson", "Airstrait", "other", 859, "", "Red Velvet", 0],
  ["Samsung", "Galaxy S25", "phone", 1499, "256 GB", "Icy Blue", 0],
  ["Apple", "iPhone 17", "phone", 1999, "256 GB", "Black", 0],
  ["Honor", "Pad X9a LTE + Keyboard", "tablet", 779, "", "", 0],
  ["Apple", "iPhone 15", "phone", 1449, "128 GB", "Blue", 3],
  ["Apple", "Watch Series 9 Aluminum 45 mm", "watch", 299, "", "Red", 0],
  ["Sony", "DualSense Limited Edition", "gaming", 219, "", "", 0],
  ["Sony", "PlayStation 5 Controller", "gaming", 129, "", "", 0],
  ["Apple", "MacBook Air 13″ M5", "other", 2499, "512 GB", "", 0],
  ["Apple", "iPhone 16", "phone", 1669, "128 GB", "Pink", 0],
  ["Apple", "iPhone 17 Pro", "phone", 2719, "256 GB", "Silver", 0],
  ["Apple", "iPhone 17", "phone", 1999, "256 GB", "Mist Blue", 0],
  ["Pitaka", "iPhone 17 Pro / Pro Max Case", "other", 129, "", "", 0],
  ["Apple", "iPad A16 Keyboard", "other", 429, "", "White", 0],
  ["Apple", "iPhone 16", "phone", 1649, "128 GB", "Black", 0],
  ["Xiaomi", "Pad 8", "tablet", 839, "256 GB", "", 0],
  ["Ray-Ban", "Meta Skyler", "other", 899, "", "Violet", 0],
  ["Dreame", "X50 Master", "other", 2279, "", "", 0],
  ["Dyson", "Airwrap i.d. + Diffuser", "other", 989, "", "", 0],
  ["Apple", "iPad A16", "tablet", 859, "128 GB", "Silver", 1],
  ["Samsung", "Galaxy A57 5G", "phone", 929, "256 GB", "Awesome Grey", 1],
  ["Dyson", "CoAnda 2X", "other", 1099, "", "", 1],
  ["Apple", "iPhone 17 Pro", "phone", 1899, "512 GB", "Cosmic Orange", 1],
  ["Apple", "iPhone 15 Pro", "phone", 1299, "256 GB", "Black Titanium", 1],
  ["Apple", "iPhone 14 Pro Max", "phone", 749, "256 GB", "Deep Purple", 1],
  ["Apple", "iPhone 17 Pro", "phone", 2669, "256 GB", "Cosmic Orange", 2],
  ["Apple", "iPhone 13 Pro Max", "phone", 799, "256 GB", "Sierra Blue", 1],
  ["Apple", "iPad Air 11″ M4", "tablet", 1719, "256 GB", "Starlight", 1],
  ["Apple", "Watch Series 9 Aluminum 45 mm", "watch", 349, "", "Starlight", 1],
  ["Samsung", "Galaxy A17", "phone", 469, "128 GB", "Black", 1],
  ["Apple", "iPhone 16 Pro", "phone", 1699, "256 GB", "Natural Titanium", 1],
  ["Apple", "iPhone 16 Pro", "phone", 1599, "128 GB", "Desert Titanium", 1],
  ["DJI", "Osmo Pocket 4 Creator Combo", "other", 1149, "", "", 1],
  ["Dyson", "Supersonic Hair Dryer", "other", 899, "", "", 1],
  ["Xiaomi", "Redmi A5", "phone", 269, "128 GB", "Midnight Black", 1],
  ["Xiaomi", "17 Ultra", "phone", 2629, "512 GB", "Black", 2],
  ["Apple", "iPhone 13", "phone", 649, "128 GB", "Starlight", 2],
  ["Apple", "iPhone 15", "phone", 789, "128 GB", "Black", 2],
  ["Canon", "PowerShot G7 X Mark III", "other", 2129, "", "Silver", 2],
  ["Samsung", "Galaxy Tab A11+", "tablet", 429, "128 GB", "", 2],
  ["Samsung", "Galaxy A27", "phone", 729, "256 GB", "Light Pink", 2],
  ["Apple", "AirPods Max 2", "audio", 989, "", "", 2],
  ["Apple", "Watch Series 11 Aluminum 42 mm", "watch", 649, "", "Rose Gold", 4],
];

export const products: Product[] = snapshots.map(
  ([brand, model, category, price, storage, color, sourceIndex]) => {
    const name = `${brand} ${model}`;
    const slug = [name, storage, color]
      .filter(Boolean)
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-$/, "");

    return {
      slug,
      name,
      brand,
      category,
      price,
      storage,
      color,
      source: sources[sourceIndex],
      verifiedAt: "2026-11-05T11:38:18Z",
      ...(sourceIndex >= 3 ? { condition: "new" as const } : {}),
    };
  },
);
