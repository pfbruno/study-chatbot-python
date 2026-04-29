import type { Metadata } from "next"

import { StudyProLanding } from "@/components/landing/studypro-landing"

export const metadata: Metadata = {
  title: "StudyPro — Entenda seus erros e estude com direção",
  description:
    "Plataforma de estudos com IA para ENEM. Resolva provas, faça simulados e receba explicações por IA nas questões que você errou ou deixou em branco.",
  openGraph: {
    title: "StudyPro — Entenda seus erros e estude com direção",
    description:
      "Transforme cada correção em direção de estudo. Provas oficiais, simulados, IA explicativa e dashboard de evolução.",
    type: "website",
  },
}

export default function Home() {
  return <StudyProLanding />
}