import { origin } from "@/lib/config";
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/*/admin", "/*/checkout", "/*/account"],
    },
    sitemap: origin + "/sitemap.xml",
  };
}
