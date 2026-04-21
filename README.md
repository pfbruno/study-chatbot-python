# StudyPro

Plataforma de estudos com foco em provas, simulados, analytics, plano de estudos e monetização por assinatura.

## Acesso

- Frontend: https://study-chatbot-python-uksv.vercel.app
- Backend: https://study-chatbot-python.onrender.com
- Docs da API: https://study-chatbot-python.onrender.com/docs

## Stack principal

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- Radix UI / shadcn-style components

### Backend
- FastAPI
- SQLite
- Stripe
- Render

## Estrutura oficial do projeto

- `studypro-ui/` → aplicação frontend oficial
- `app/` → backend FastAPI oficial
- `lovable-reference/` → referência visual e estrutural para redesign
- `docs/` → documentação interna do projeto

## Regras de arquitetura

1. O produto oficial roda em `studypro-ui`.
2. O backend oficial roda em `app`.
3. A pasta `lovable-reference` não é a aplicação oficial e não deve receber lógica de negócio do produto.
4. Toda nova implementação deve ser feita no `studypro-ui`, usando `lovable-reference` apenas como referência visual e de UX.
5. Mudanças de frontend devem respeitar os contratos reais da API do backend.

## Escopo atual do produto

- autenticação
- dashboard
- provas
- simulados
- billing
- checkout Stripe
- analytics
- entitlements free/pro
- base para chat IA e área de estudo

## Próximas prioridades técnicas

1. alinhar contratos frontend ↔ backend
2. consolidar shell visual autenticado
3. unificar navegação interna
4. melhorar conversão e pricing
5. refinar chat IA e área de estudo

## Deploy

### Frontend
Deploy em Vercel com raiz no diretório `studypro-ui/`.

### Backend
Deploy em Render com start command apontando para:

```bash
uvicorn app.api:app --host 0.0.0.0 --port $PORT