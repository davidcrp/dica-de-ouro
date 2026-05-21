import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import type { Loja } from '@/lib/types'

export async function POST(req: Request) {
  const { query, lojas }: { query: string; lojas: Loja[] } = await req.json()

  const lista = lojas.map((l, i) =>
    `${i}: ${l['NOME'] || l.nome} | ${l['CATEGORIA'] || l.categoria} | ${l['ENDEREÇO'] || l.endereco} | ${l['DESCRIÇÃO'] || l.descricao || ''}`
  ).join('\n')

  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    prompt: `Dado a busca do usuário: "${query}"

Lista de locais disponíveis (formato: índice|nome|categoria|endereço|descrição):
${lista}

Retorne APENAS os índices (números separados por vírgula) dos locais mais relevantes para a busca. Máximo 10 resultados. Se nenhum for relevante, retorne vazio.
Exemplo de resposta: 2,7,14`,
    maxOutputTokens: 100,
  })

  const indices = text.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n < lojas.length)
  const resultado = indices.map(i => lojas[i]).filter(Boolean)

  return Response.json({ resultado })
}
