import type { Metadata } from "next"

import { MinhAprovaçãoLanding } from "@/components/landing/MinhAprovação-landing"

export const metadata: Metadata = {
  title: "MinhAprovação â€” Entenda seus erros e estude com direÃ§Ã£o",
  description:
    "Plataforma de estudos com IA para ENEM. Resolva provas, faÃ§a simulados e receba explicaÃ§Ãµes por IA nas questÃµes que vocÃª errou ou deixou em branco.",
  openGraph: {
    title: "MinhAprovação â€” Entenda seus erros e estude com direÃ§Ã£o",
    description:
      "Transforme cada correÃ§Ã£o em direÃ§Ã£o de estudo. Provas oficiais, simulados, IA explicativa e dashboard de evoluÃ§Ã£o.",
    type: "website",
  },
}

export default function Home() {
  return <MinhAprovaçãoLanding />
}
