import type { Metadata } from "next"

import { SeoPage } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: 'Estudar para o ENEM com IA, simulados e correção inteligente',
  description: 'Use o MinhAprovação para praticar questões, fazer simulados, resolver provas oficiais e entender seus erros com apoio de IA durante a preparação para o ENEM.',
  alternates: {
    canonical: 'https://www.minhaprovacao.com.br/enem',
  },
  openGraph: {
    title: 'Estudar para o ENEM com IA, simulados e correção inteligente',
    description: 'Use o MinhAprovação para praticar questões, fazer simulados, resolver provas oficiais e entender seus erros com apoio de IA durante a preparação para o ENEM.',
    url: 'https://www.minhaprovacao.com.br/enem',
    type: "article",
  },
}

export default function Page() {
  return (
    <SeoPage
      badge='ENEM com IA'
      title='Estude para o ENEM com prática, correção e direção'
      description='O MinhAprovação é uma plataforma de estudos para ENEM criada para ajudar estudantes a praticarem mais, entenderem seus erros e acompanharem a evolução com dados reais.'
      sections=[{"{ title: 'Por que estudar com questões?', content: 'Resolver questões ajuda o estudante a identificar lacunas, testar conhecimentos e perceber quais temas precisam de revisão. A prática direcionada torna o estudo mais objetivo e reduz a sensação de estudar sem saber o que melhorar.' },\n    { title: 'Como a IA ajuda na correção?', content: 'A correção inteligente auxilia na explicação dos erros e mostra caminhos de revisão. A proposta é transformar cada erro em uma indicação clara do que precisa ser estudado com mais atenção.' },\n    { title: 'O que o MinhAprovação oferece?', content: 'A plataforma reúne provas, simulados, modo treino, acompanhamento de desempenho, créditos gratuitos diários e recursos de IA para apoiar a rotina de estudos para o ENEM.' }"}]
    />
  )
}
