import type { Metadata } from "next"

import { SeoPage } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: 'Simulados ENEM online com correção e desempenho',
  description: 'Faça simulados ENEM online, acompanhe seu desempenho e revise seus erros com apoio de IA no MinhAprovação.',
  alternates: {
    canonical: 'https://www.minhaprovacao.com.br/enem/simulados',
  },
  openGraph: {
    title: 'Simulados ENEM online com correção e desempenho',
    description: 'Faça simulados ENEM online, acompanhe seu desempenho e revise seus erros com apoio de IA no MinhAprovação.',
    url: 'https://www.minhaprovacao.com.br/enem/simulados',
    type: "article",
  },
}

export default function Page() {
  return (
    <SeoPage
      badge='Simulados ENEM'
      title='Simulados ENEM para treinar com mais estratégia'
      description='Os simulados ajudam a criar ritmo, testar conhecimento e entender quais áreas precisam de mais atenção antes da prova.'
      sections=[{"{ title: 'Treino com questões', content: 'O simulado é uma forma prática de testar conteúdos de diferentes áreas do conhecimento e desenvolver resistência para provas longas.' },\n    { title: 'Correção orientada', content: 'Depois de responder, o estudante consegue analisar erros, acertos e pontos que precisam de revisão.' },\n    { title: 'Evolução por desempenho', content: 'Com dados de tentativas e desempenho, fica mais fácil acompanhar a evolução e estudar com foco nas maiores dificuldades.' }"}]
    />
  )
}
