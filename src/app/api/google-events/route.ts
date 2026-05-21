import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

export async function GET() {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_CX

  if (!apiKey || !cx) return Response.json({ eventos: [] })

  const query = encodeURIComponent('eventos Ouro Preto MG 2026')
  const url = `https://www.googleapis.com/customsearch/v1?q=${query}&key=${apiKey}&cx=${cx}&num=10`

  const res = await fetch(url)
  const data = await res.json()
  const items = data.items || []

  if (!items.length) return Response.json({ eventos: [] })

  const resumo = items.map((item: { title: string; snippet: string; link: string }) =>
    `Título: ${item.title}\nExcerto: ${item.snippet}\nLink: ${item.link}`
  ).join('\n\n')

  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    prompt: `A partir dos resultados de busca abaixo sobre eventos em Ouro Preto, extraia os eventos que têm data definida.
Retorne um JSON array com: [{"nome": "", "data_evento": "YYYY-MM-DD", "local": "", "descricao": "", "link": "", "fonte": ""}]
Se não houver data clara, omita o evento. Retorne APENAS o JSON, sem markdown.

${resumo}`,
    maxOutputTokens: 1000,
  })

  try {
    const eventos = JSON.parse(text.trim())
    return Response.json({ eventos })
  } catch {
    return Response.json({ eventos: [] })
  }
}
