# Repository Architecture

## Objetivo

Este documento define a arquitetura oficial do StudyPro e evita ambiguidade entre produto principal e referências visuais.

## Pastas oficiais

### `studypro-ui/`
Aplicação frontend oficial do produto.

Responsabilidades:
- páginas públicas
- autenticação
- dashboard
- provas
- simulados
- pricing
- integração com a API

### `app/`
Backend FastAPI oficial.

Responsabilidades:
- autenticação
- dashboard
- billing
- Stripe
- exames
- simulados
- analytics
- entitlements
- regras de negócio

## Pastas auxiliares

### `lovable-reference/`
Referência visual/UX.

Uso permitido:
- inspiração de layout
- estrutura de navegação
- padrões de componentes
- direção visual para redesign

Uso não permitido:
- lógica oficial do produto
- implementação paralela de fluxos reais
- duplicação de frontend de produção

## Regra principal

Toda funcionalidade oficial deve ser implementada em:
- `studypro-ui/` para frontend
- `app/` para backend

## Fluxo recomendado de redesign

1. validar contrato do backend
2. adaptar tipos e hooks no frontend oficial
3. portar layout/componentes do `lovable-reference`
4. testar build e deploy
5. só então expandir páginas adicionais

## Motivo desta regra

O `lovable-reference` usa uma organização útil como referência visual, mas o produto oficial precisa permanecer coerente com:
- Next.js App Router
- deploy atual na Vercel
- hooks e integrações existentes
- contratos reais da API

## Pastas que não devem ser usadas como fonte oficial de implementação

- `lovable-reference-old/` ou qualquer pasta de backup visual antiga
- qualquer frontend paralelo fora de `studypro-ui/`

## Checklist antes de desenvolver

- esta mudança será feita em `studypro-ui`?
- esta mudança respeita o contrato real do backend?
- esta mudança usa `lovable-reference` apenas como referência?
- esta mudança preserva o deploy atual?

Se qualquer resposta for “não”, a implementação deve ser revista antes do commit.