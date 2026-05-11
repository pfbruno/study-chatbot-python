import type { MetadataRoute } from "next"

const SITE_URL = "https://www.minhaprovacao.com.br"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/enem`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/enem/simulados`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/enem/provas`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/enem/questoes`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/enem/correcao-com-ia`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ]
}
