import type { Metadata } from "next"

import { SeoPage } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: 'Correção com IA para estudar para o ENEM',
  description: 'Use correção com IA para entender seus erros em questões, simulados e provas do ENEM.',
  alternates: {
    canonical: 'https://www.minhaprovacao.com.br/enem/correcao-com-ia',
  },
  openGraph: {
    title: 'Correção com IA para estudar para o ENEM',
    description: 'Use correção com IA para entender seus erros em questões, simulados e provas do ENEM.',
    url: 'https://www.minhaprovacao.com.br/enem/correcao-com-ia',
    type: "article",
  },
}

export default function Page() {
  return (
    <SeoPage
      badge='Correção com IA'
      title='Correção com IA para entender seus erros no ENEM'
      description='A IA pode ajudar o estudante a transformar uma resposta errada em explicação, revisão e próximo passo de estudo.'
      sections=[{"{ title: 'Erro não é só nota baixa', content: 'Cada erro indica uma lacuna de interpretação, conteúdo ou estratégia. Entender o erro é essencial para evoluir.' },\n    { title: 'Explicação direcionada', content: 'A correção com IA pode ajudar a explicar por que uma alternativa está incorreta e qual conceito precisa ser revisado.' },\n    { title: 'Estudo com mais clareza', content: 'O objetivo do MinhAprovação é dar direção ao estudo: praticar, corrigir, revisar e acompanhar evolução.' }"}]
    />
  )
}
