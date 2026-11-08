# Telefon28Mobile catalog provenance

Reviewed 8 November 2026. The owner explicitly authorized reuse of photographs from Telefon28Mobile’s own Tap.az listings in this conversation. Ten selected individual listings were checked for the seller name, product title, current advertised price and photograph. This is a one-time launch catalog, not a scraper or live marketplace synchronization.

Stock has not been independently confirmed. Prices are dated snapshots; the shop owner must maintain them through /admin. Used-item defects and battery information are preserved in all three languages. No global warranty or delivery terms are inferred. Original marketplace watermarks are retained.

| Product | AZN | Source |
|---|---:|---|
| Apple iPhone 14 128 GB Blue | 559 | [Listing](https://tap.az/elanlar/elektronika/telefonlar/49076729) |
| Apple iPhone 15 128 GB Black | 789 | [Listing](https://tap.az/elanlar/elektronika/telefonlar/49041247) |
| Apple iPhone 17 Pro 256 GB Silver | 2199 | [Listing](https://tap.az/elanlar/elektronika/telefonlar/49104970) |
| Xiaomi Redmi A7 Pro 128 GB Black | 329 | [Listing](https://tap.az/elanlar/elektronika/telefonlar/47822941) |
| Apple iPhone 18 Pro 512 GB Black | 3649 | [Listing](https://tap.az/elanlar/elektronika/telefonlar/48822711) |
| Apple iPhone 15 128 GB Blue | 1399 | [Listing](https://tap.az/elanlar/elektronika/telefonlar/47001254) |
| Apple Watch Series 11 Aluminum 42mm  Jet Black | 649 | [Listing](https://tap.az/elanlar/elektronika/smart-saat-ve-qolbaqlar/48607589) |
| Dyson Airwrap i.d Ceramic Pop  Ceramic Pop | 949 | [Listing](https://tap.az/elanlar/sexsi-esyalar/gozellik-saglamliq/43754376) |
| Apple Watch Series 11 Aluminum 42mm  Rose Gold | 649 | [Listing](https://tap.az/elanlar/elektronika/smart-saat-ve-qolbaqlar/48607583) |
| Xiaomi Redmi Note 15 256 GB Black | 519 | [Listing](https://tap.az/elanlar/elektronika/telefonlar/46774272) |

`data/verified-listings.json` records source URLs, photo URLs, permission, review date, slugs and translated descriptions. `supabase/seeds/owner-listings.sql` inserts initial rows without overwriting subsequent owner changes. `scripts/prepare-owner-seed.mjs` prepares SQL and optionally uploads approved local files; it never fetches marketplace listings.

The seller-specific catalog URL supplied by the user did not expose individual links through the available page read. Tablets, laptops, headphones, consoles and accessories therefore remain available categories without invented products. Their distinct category icons can be replaced automatically by the first owner-uploaded product photograph.
