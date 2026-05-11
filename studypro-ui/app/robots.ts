import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = "https://www.minhaprovacao.com.br"

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/enem",
          "/enem/simulados",
          "/enem/provas",
          "/enem/questoes",
          "/enem/correcao-com-ia",
          "/pricing",
        ],
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/success",
          "/verify-email",
          "/api",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
