import type { Product } from "@/data/products";

// Illustrations follow the advertised model family and finish. New listings
// use the category illustration until a matching drawing is available.
const illustrations: Record<string, string> = {
  "Apple AirPods Max 2|": "headphones",
  "Apple MacBook Air 13″ M5|": "laptop",
  "Apple MacBook Neo 13″ A18 Pro|Silver": "laptop",
  "Apple Watch Series 11 Aluminum 42 mm|Rose Gold": "watch-rose",
  "Apple Watch Series 9 Aluminum 45 mm|Red": "watch-red",
  "Apple Watch Series 9 Aluminum 45 mm|Starlight": "watch-starlight",
  "Apple Watch Ultra 3|Black": "watch-black",
  "Apple iPad A16 Keyboard|White": "keyboard",
  "Apple iPhone 12 Pro Max|Graphite": "phone-pro-graphite",
  "Apple iPhone 13 Pro Max|Sierra Blue": "phone-pro-blue",
  "Apple iPhone 13|Starlight": "phone-diagonal-silver",
  "Apple iPhone 14 Pro Max|Deep Purple": "phone-pro-purple",
  "Apple iPhone 14 Pro|Deep Purple": "phone-pro-purple",
  "Apple iPhone 14|Blue": "phone-diagonal-blue",
  "Apple iPhone 15 Pro|Black Titanium": "phone-pro-graphite",
  "Apple iPhone 15 Pro|Blue Titanium": "phone-pro-cobalt",
  "Apple iPhone 15|Black": "phone-diagonal-graphite",
  "Apple iPhone 15|Blue": "phone-diagonal-blue",
  "Apple iPhone 16 Pro Max|Desert Titanium": "phone-pro-gold",
  "Apple iPhone 16 Pro|Desert Titanium": "phone-pro-gold",
  "Apple iPhone 16 Pro|Natural Titanium": "phone-pro-titanium",
  "Apple iPhone 16|Black": "phone-twin-graphite",
  "Apple iPhone 16|Pink": "phone-twin-pink",
  "Apple iPhone 17 Pro Max|Silver": "phone-plateau-silver",
  "Apple iPhone 17 Pro|Deep Blue": "phone-plateau-cobalt",
  "Apple iPhone 17 Pro|Silver": "phone-plateau-silver",
  "Apple iPhone 17|Black": "phone-twin-graphite",
  "Apple iPhone 17|Mist Blue": "phone-twin-blue",
  "Apple iPhone Air|Sky Blue": "phone-air-blue",
  "DJI Osmo Pocket 4 Creator Combo|": "gimbal",
  "Dreame X50 Master|": "vacuum",
  "Dyson Airstrait|Red Velvet": "straightener",
  "Dyson Airwrap i.d. + Diffuser|": "styler",
  "Dyson CoAnda 2X|": "styler",
  "Dyson Supersonic Hair Dryer|": "dryer",
  "Pitaka iPhone 17 Pro / Pro Max Case|": "case",
  "Ray-Ban Meta Skyler|Violet": "glasses",
  "Samsung Galaxy A17|Black": "phone-galaxy-graphite",
  "Samsung Galaxy A27|Light Pink": "phone-galaxy-pink",
  "Samsung Galaxy A57 5G|Awesome Grey": "phone-galaxy-graphite",
  "Samsung Galaxy S24 Ultra|Titanium Yellow": "phone-galaxy-ultra-yellow",
  "Samsung Galaxy S25|Icy Blue": "phone-galaxy-blue",
  "Samsung Galaxy S26 Ultra|Black": "phone-galaxy-ultra-graphite",
  "Sony DualSense Limited Edition|": "controller",
  "Sony PlayStation 5 Controller|": "controller",
  "Xiaomi 17 Ultra|Black": "phone-redmi-ultra-graphite",
  "Xiaomi Redmi 15|Midnight Black": "phone-redmi-graphite",
  "Xiaomi Redmi A5|Midnight Black": "phone-redmi-graphite",
};

export function artFor(product: Product): string {
  if (product.images?.[0]) return product.images[0].url;
  const key = [product.name, product.color].join("|");
  const illustration =
    illustrations[key] ??
    (["phone", "tablet", "watch", "audio", "gaming"].includes(product.category)
      ? product.category
      : "other");
  return `/art/${illustration}.svg`;
}
