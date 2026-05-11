import type { Metadata } from "next"

import { SeoPage } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: 'Provas do ENEM para resolver online',
  description: 'Resolva provas do ENEM online, confira desempenho e use correção inteligente para revisar seus erros.',
  alternates: {
    canonical: 'https://www.minhaprovacao.com.br/enem/provas',
  },
  openGraph: {
    title: 'Provas do ENEM para resolver online',
    description: 'Resolva provas do ENEM online, confira desempenho e use correção inteligente para revisar seus erros.',
    url: 'https://www.minhaprovacao.com.br/enem/provas',
    type: "article",
  },
}

export default function Page() {
  return (
    <SeoPage
      badge='Provas ENEM'
      title='Resolva provas do ENEM e transforme erro em revisão'
      description='Resolver provas anteriores é uma das formas mais objetivas de entender o estilo da avaliação e treinar interpretação, gestão de tempo e estratégia.'
      sections=[{"{ title: 'Por que fazer provas anteriores?', content: 'As provas anteriores permitem contato direto com o formato do ENEM, tipos de enunciado e recorrência de habilidades cobradas.' },\n    { title: 'Correção como ferramenta de estudo', content: 'A correção não deve ser apenas um gabarito. Ela precisa mostrar o motivo do erro e ajudar o estudante a revisar melhor.' },\n    { title: 'Prática com direção', content: 'No MinhAprovação, a prática com provas é integrada a desempenho, histórico e recursos de revisão inteligente.' }"}]
    />
  )
}
