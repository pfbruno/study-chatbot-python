import type { Metadata } from "next"
import Script from "next/script"

import { StudyProLanding } from "@/components/landing/studypro-landing"

const SITE_URL = "https://www.minhaprovacao.com.br"

export const metadata: Metadata = {
  title: "MinhAprovação — Entenda seus erros e estude com direção",
  description:
    "Plataforma de estudos com IA para ENEM. Resolva provas, faça simulados e receba explicações por IA nas questões que você errou ou deixou em branco.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "MinhAprovação — Entenda seus erros e estude com direção",
    description:
      "Transforme cada correção em direção de estudo. Provas oficiais, simulados, IA explicativa e dashboard de evolução.",
    url: SITE_URL,
    type: "website",
  },
}

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MinhAprovação",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "Plataforma de estudos com IA para ENEM, simulados, provas, modo treino, correção inteligente e acompanhamento de desempenho.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BRL",
    description: "Plano gratuito com créditos diários para estudantes.",
  },
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "student",
  },
  educationalUse: [
    "Preparação para ENEM",
    "Simulados",
    "Questões",
    "Correção de erros",
    "Revisão"
  ],
}

export default function Home() {
  return (
    <>
      <Script
        id="minhaprovacao-structured-data"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <StudyProLanding />
    </>
  )
}
