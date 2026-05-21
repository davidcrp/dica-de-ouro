import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

export async function POST(req: Request) {
  const { nome, categoria, endereco } = await req.json()

  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    prompt: `Escreva uma descrição curta e atraente (máximo 120 caracteres) para um estabelecimento em Ouro Preto:
Nome: ${nome}
Categoria: ${categoria}
Endereço: ${endereco}

A descrição deve ser em português, calorosa, no estilo de um guia local. Retorne APENAS a descrição, sem aspas ou explicações.`,
    maxOutputTokens: 150,
  })

  return Response.json({ descricao: text.trim() })
}
