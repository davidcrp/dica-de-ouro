# Dica de Ouro — guia de Ouro Preto

App web para turistas e visitantes de Ouro Preto (MG): lugares, eventos,
agenda e um assistente com IA que responde dúvidas sobre a cidade.

**App no ar:** https://dica-de-ouro-next.vercel.app

## Funcionalidades

- Explorar lugares e eventos, com mapa (Leaflet) e dados do Google Places
- Agenda de eventos integrada ao Google
- Chat com assistente de IA sobre a cidade
- Avaliações, cadastro de estabelecimentos e painel administrativo
- Login com Clerk

## Stack

- Next.js (App Router) + React + TypeScript
- Supabase (banco de dados)
- Clerk (autenticação)
- Vercel AI SDK com Claude (chat e descrições)
- Leaflet (mapas)
- Deploy na Vercel

## Estrutura

| Caminho | O que é |
|---|---|
| `src/components/Tela*.tsx` | Telas do app: Home, Explorar, Lugar, Evento, Agenda, Chat, Admin… |
| `src/app/api` | Rotas: busca, chat, descrições, Google Places e eventos |
| `src/lib` | Contexto do app, cliente Supabase e tipos |

## Rodar localmente

```bash
npm install
npm run dev
```

Abre em http://localhost:3000. Precisa das chaves do Clerk, Supabase, Google e Anthropic num `.env.local`.
