import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/posts", "/categories", "/rss.xml"],
      disallow: ["/dashboard", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
