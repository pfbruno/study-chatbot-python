import type { Metadata, Viewport } from "next"
import Script from "next/script"

import "./globals.css"

const SITE_URL = "https://www.minhaprovacao.com.br"
const SITE_NAME = "MinhAprovação"
const SITE_DESCRIPTION =
  "Plataforma de estudos com IA para ENEM. Resolva provas, faça simulados, treine questões e entenda seus erros com correção inteligente."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "MinhAprovação — Estude para o ENEM com IA",
    template: "%s | MinhAprovação",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "ENEM",
    "simulado ENEM",
    "questões ENEM",
    "provas ENEM",
    "correção com IA",
    "plataforma de estudos",
    "estudar para o ENEM",
    "treino ENEM",
    "inteligência artificial para estudos",
    "revisão ENEM",
    "preparação ENEM",
    "MinhAprovação",
  ],
  authors: [{ name: "MinhAprovação" }],
  creator: "MinhAprovação",
  publisher: "MinhAprovação",
  category: "education",
  generator: "Next.js",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "MinhAprovação — Entenda seus erros e estude com direção",
    description:
      "Resolva provas, faça simulados e receba explicações por IA nas questões que você errou ou deixou em branco.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "MinhAprovação — Plataforma de estudos com IA para ENEM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MinhAprovação — Estude para o ENEM com IA",
    description: SITE_DESCRIPTION,
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      {
        url: "/icon.png",
        type: "image/png",
      },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: "#050b16",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

const GA_ID = "G-R8NY75KL5Y"

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>

      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
