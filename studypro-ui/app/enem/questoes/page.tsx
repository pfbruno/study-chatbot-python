import type { Metadata } from "next"

import { SeoPage } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: "Questões ENEM para treinar online",
  description: "Treine questões do ENEM online com prática direcionada, correção e acompanhamento de evolução.",
  alternates: {
    canonical: "https://www.minhaprovacao.com.br/enem/questoes",
  },
  openGraph: {
    title: "Questões ENEM para treinar online",
    description: "Treine questões do ENEM online com prática direcionada, correção e acompanhamento de evolução.",
    url: "https://www.minhaprovacao.com.br/enem/questoes",
    type: "article",
  },
}

export default function Page() {
  return (
    <SeoPage
      badge="Questões ENEM"
      title="Treine questões do ENEM com foco no que você precisa melhorar"
      description="Questões são uma forma eficiente de praticar recuperação ativa e perceber quais conteúdos realmente foram assimilados."
      sections={[
              {
                      "title": "Prática ativa",
                      "content": "Ao responder questões, o estudante precisa recuperar informações, interpretar dados e aplicar conceitos, o que fortalece a aprendizagem."
              },
              {
                      "title": "Identificação de erros",
                      "content": "Os erros mostram onde a revisão deve ser concentrada. Isso evita estudar tudo novamente sem critério."
              },
              {
                      "title": "Treino rápido",
                      "content": "O modo treino permite praticar questões de forma objetiva, mantendo constância e criando rotina de estudo."
              }
      ]}
    />
  )
}
